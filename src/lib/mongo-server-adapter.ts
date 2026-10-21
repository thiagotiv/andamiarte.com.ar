import type { Database } from "@/integrations/supabase/types";
import { getDb } from "./mongodb";

export class ServerMongoQueryBuilder<TRow = any> {
  private collectionName: string;
  private filters: Record<string, any> = {};
  private orConditions: any[] = [];
  private sortOptions?: Record<string, 1 | -1>;
  private limitNumber?: number;
  private pendingOperation: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  private payloadData: any = null;
  private isSingle = false;
  private isMaybeSingle = false;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  select(_columns = "*") {
    this.pendingOperation = "select";
    return this;
  }

  eq(field: string, value: any) {
    if (field === "id") {
      this.filters["$or"] = [{ id: value }, { _id: value }];
    } else {
      this.filters[field] = value;
    }
    return this;
  }

  match(obj: Record<string, any>) {
    Object.assign(this.filters, obj);
    return this;
  }

  in(field: string, values: any[]) {
    if (field === "id") {
      this.filters["$or"] = [{ id: { $in: values } }, { _id: { $in: values } }];
    } else {
      this.filters[field] = { $in: values };
    }
    return this;
  }

  or(filterStr: string) {
    const clauses = filterStr.split(",").map((clause) => {
      const parts = clause.trim().split(".");
      const field = parts[0] || "";
      const op = parts[1] || "eq";
      const val = parts.slice(2).join(".");
      if (op === "eq") {
        if (field === "id") {
          return { $or: [{ id: val }, { _id: val }] };
        }
        return { [field]: val };
      }
      return { [field]: val };
    });

    if (clauses.length > 0) {
      this.orConditions.push(...clauses);
    }
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.sortOptions = { [field]: options?.ascending === false ? -1 : 1 };
    return this;
  }

  limit(n: number) {
    this.limitNumber = n;
    return this;
  }

  single(): PromiseLike<{ data: TRow; error: any }> {
    this.isSingle = true;
    return this as any;
  }

  maybeSingle(): PromiseLike<{ data: TRow | null; error: any }> {
    this.isMaybeSingle = true;
    return this as any;
  }

  insert(data: any) {
    this.pendingOperation = "insert";
    this.payloadData = data;
    return this;
  }

  update(data: any) {
    this.pendingOperation = "update";
    this.payloadData = data;
    return this;
  }

  upsert(data: any, _options?: any) {
    this.pendingOperation = "upsert";
    this.payloadData = data;
    return this;
  }

  delete() {
    this.pendingOperation = "delete";
    return this;
  }

  async then<TResult1 = { data: TRow[]; error: any }, TResult2 = never>(
    resolve?: ((value: { data: TRow[]; error: any }) => TResult1 | PromiseLike<TResult1>) | null,
    reject?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    try {
      const result = await this.execute();
      if (resolve) return resolve(result);
      return result as any;
    } catch (err) {
      if (reject) return reject(err);
      return { data: null, error: err } as any;
    }
  }

  private buildFinalFilter(): Record<string, any> {
    const finalFilter: Record<string, any> = { ...this.filters };
    if (this.orConditions.length > 0) {
      if (finalFilter["$or"]) {
        finalFilter["$and"] = [
          { $or: finalFilter["$or"] },
          { $or: this.orConditions },
        ];
        delete finalFilter["$or"];
      } else {
        finalFilter["$or"] = this.orConditions;
      }
    }
    return finalFilter;
  }

  private normalizeDoc(doc: any): TRow {
    if (!doc) return doc;
    const normalized = { ...doc };
    if (!normalized.id && normalized._id) {
      normalized.id = String(normalized._id);
    }
    if (this.collectionName === "profiles") {
      normalized.skills = Array.isArray(normalized.skills) ? normalized.skills : [];
      normalized.education = Array.isArray(normalized.education) ? normalized.education : [];
      normalized.experience = Array.isArray(normalized.experience) ? normalized.experience : [];
      normalized.years_experience = typeof normalized.years_experience === "number" ? normalized.years_experience : 0;
      normalized.available = typeof normalized.available === "boolean" ? normalized.available : true;
      normalized.public_profile = typeof normalized.public_profile === "boolean" ? normalized.public_profile : true;
    }
    return normalized as TRow;
  }

  private async execute(): Promise<{ data: any; error: any }> {
    try {
      const db = await getDb();
      const coll = db.collection<any>(this.collectionName);
      const filter = this.buildFinalFilter();

      if (this.pendingOperation === "insert") {
        if (Array.isArray(this.payloadData)) {
          const docs = this.payloadData.map((item) => {
            const id = item.id || crypto.randomUUID();
            return { _id: id, id, ...item };
          });
          if (docs.length > 0) {
            await coll.insertMany(docs);
          }
          return { data: docs.map((d) => this.normalizeDoc(d)), error: null };
        } else {
          const id = this.payloadData.id || crypto.randomUUID();
          const doc = { _id: id, id, ...this.payloadData };
          await coll.insertOne(doc);
          return { data: this.normalizeDoc(doc), error: null };
        }
      }

      if (this.pendingOperation === "update") {
        await coll.updateMany(filter, { $set: this.payloadData });
        const updated = await coll.find(filter).toArray();
        return { data: updated.map((d) => this.normalizeDoc(d)), error: null };
      }

      if (this.pendingOperation === "upsert") {
        const id = this.payloadData.id || crypto.randomUUID();
        const doc = { id, ...this.payloadData };
        await coll.updateOne(filter, { $set: doc }, { upsert: true });
        return { data: this.normalizeDoc(doc), error: null };
      }

      if (this.pendingOperation === "delete") {
        await coll.deleteMany(filter);
        return { data: true, error: null };
      }

      // SELECT
      if (this.isSingle || this.isMaybeSingle) {
        let doc = await coll.findOne(filter);

        // Fallbacks inteligentes para profiles y user_roles
        if (!doc) {
          if (this.collectionName === "profiles") {
            const targetId = this.filters["id"] || (this.filters["$or"] && this.filters["$or"][0]?.id);
            if (targetId && typeof targetId === "string") {
              const now = new Date().toISOString();
              const newProfile = {
                _id: targetId,
                id: targetId,
                name: "Usuario",
                role: "aie",
                phone: "",
                zone: "",
                skills: [],
                education: [],
                experience: [],
                years_experience: 0,
                available: true,
                public_profile: true,
                created_at: now,
                updated_at: now,
              };
              await coll.insertOne(newProfile);
              doc = newProfile;
            }
          } else if (this.collectionName === "user_roles") {
            const targetUserId = this.filters["user_id"];
            if (targetUserId && typeof targetUserId === "string") {
              const newRole = {
                _id: targetUserId,
                user_id: targetUserId,
                role: "aie",
                created_at: new Date().toISOString(),
              };
              await coll.insertOne(newRole);
              doc = newRole;
            }
          }
        }

        if (this.isSingle && !doc) {
          return { data: null, error: { message: "No rows found" } };
        }
        return { data: doc ? this.normalizeDoc(doc) : null, error: null };
      }

      let cursor = coll.find(filter);
      if (this.sortOptions) {
        cursor = cursor.sort(this.sortOptions);
      }
      if (this.limitNumber) {
        cursor = cursor.limit(this.limitNumber);
      }
      const docs = await cursor.toArray();
      return { data: docs.map((d) => this.normalizeDoc(d)), error: null };
    } catch (err: any) {
      console.error(`[ServerMongoQueryBuilder:${this.collectionName}] error:`, err);
      return { data: null, error: { message: err?.message || "Error en operación MongoDB" } };
    }
  }
}

export function createMongoServerClient() {
  return {
    from: <TableName extends keyof Database["public"]["Tables"]>(tableName: TableName) =>
      new ServerMongoQueryBuilder<Database["public"]["Tables"][TableName]["Row"]>(tableName as string),
  };
}
