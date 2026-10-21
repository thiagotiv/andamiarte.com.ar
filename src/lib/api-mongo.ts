import { createServerFn } from "@tanstack/react-start";
import { registerMongoUser, loginMongoUser, verifyToken, getMongoUserById } from "./auth-mongo";
import { getDb, initMongoIndexes } from "./mongodb";

function formatMongoError(err: any): Error {
  const msg = err?.message || String(err);
  if (
    msg.includes("SSL alert number 80") ||
    err?.code === "ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR" ||
    err?.name === "MongoServerSelectionError" ||
    msg.includes("querySrv")
  ) {
    return new Error(
      "No se pudo conectar a MongoDB Atlas: Tu IP pública actual no está autorizada en Network Access. " +
      "Ingresa a https://cloud.mongodb.com -> Security -> Network Access y agrega '0.0.0.0/0' o tu IP actual."
    );
  }
  return err instanceof Error ? err : new Error(msg);
}

// =====================================================================
// SERVER FUNCTIONS DE AUTENTICACIÓN DIRECTA CON MONGODB ATLAS
// =====================================================================

export const mongoSignUpFn = createServerFn({ method: "POST" })
  .validator((d: {
    email: string;
    password: string;
    role?: string | undefined;
    name?: string | undefined;
    phone?: string | undefined;
    zone?: string | undefined;
  }) => ({
    email: String(d.email || ""),
    password: String(d.password || ""),
    role: d.role ? String(d.role) : undefined,
    name: d.name ? String(d.name) : undefined,
    phone: d.phone ? String(d.phone) : undefined,
    zone: d.zone ? String(d.zone) : undefined,
  }))
  .handler(async ({ data }) => {
    if (!data.email || !data.password) {
      throw new Error("El correo y la contraseña son requeridos.");
    }
    try {
      return await registerMongoUser(data);
    } catch (err: any) {
      throw formatMongoError(err);
    }
  });

export const mongoSignInFn = createServerFn({ method: "POST" })
  .validator((d: { email: string; password: string }) => ({
    email: String(d.email || ""),
    password: String(d.password || ""),
  }))
  .handler(async ({ data }) => {
    if (!data.email || !data.password) {
      throw new Error("El correo y la contraseña son requeridos.");
    }
    try {
      return await loginMongoUser(data);
    } catch (err: any) {
      throw formatMongoError(err);
    }
  });

export const mongoGetSessionFn = createServerFn({ method: "POST" })
  .validator((d: { token?: string | null | undefined }) => ({
    token: d.token ? String(d.token) : null,
  }))
  .handler(async ({ data }) => {
    if (!data.token) return { user: null };
    const claims = verifyToken(data.token);
    if (!claims) return { user: null };

    try {
      const userInfo = await getMongoUserById(claims.id);
      if (!userInfo) return { user: null };

      return {
        user: {
          id: userInfo.id,
          email: userInfo.email,
          role: userInfo.role,
          name: userInfo.name,
        },
      };
    } catch (err) {
      console.warn("[MongoDB Atlas] Aviso al obtener sesión:", err);
      // Fallback al payload del token JWT verificado si la BD no responde
      return {
        user: {
          id: claims.id,
          email: claims.email,
          role: claims.role,
          name: claims.name,
        },
      };
    }
  });

// =====================================================================
// OPERACIONES CRUD EN MONGODB ATLAS (PARA MUTACIONES CLIENTE)
// =====================================================================

export type MongoCrudPayload = {
  collection: string;
  operation: "find" | "findOne" | "insertOne" | "updateOne" | "deleteOne" | "deleteMany";
  filter?: Record<string, any> | undefined;
  data?: Record<string, any> | undefined;
  sort?: Record<string, 1 | -1> | undefined;
  limit?: number | undefined;
};

export const mongoCrudFn = createServerFn({ method: "POST" })
  .validator((d: MongoCrudPayload) => ({
    collection: String(d.collection),
    operation: d.operation,
    filter: d.filter ?? {},
    data: d.data ?? {},
    sort: d.sort,
    limit: d.limit,
  }))
  .handler(async ({ data: op }): Promise<{ data: any; error: string | null }> => {
    try {
      await initMongoIndexes();
      const db = await getDb();
      const coll = db.collection<any>(op.collection);

      const filter: Record<string, any> = { ...op.filter };
      if (filter["id"] && !filter["$or"]) {
        const idVal = filter["id"];
        delete filter["id"];
        filter["$or"] = [{ id: idVal }, { _id: idVal }];
      }

      switch (op.operation) {
        case "find": {
          let cursor = coll.find(filter);
          if (op.sort) cursor = cursor.sort(op.sort);
          if (op.limit) cursor = cursor.limit(op.limit);
          const results = await cursor.toArray();
          return { data: results, error: null };
        }
        case "findOne": {
          const item = await coll.findOne(filter);
          return { data: item, error: null };
        }
        case "insertOne": {
          const doc = {
            _id: op.data["_id"] || op.data["id"] || crypto.randomUUID(),
            id: op.data["id"] || op.data["_id"] || crypto.randomUUID(),
            ...op.data,
            created_at: op.data["created_at"] || new Date().toISOString(),
          };
          const res = await coll.insertOne(doc);
          return { data: { ...doc, _id: res.insertedId }, error: null };
        }
        case "updateOne": {
          const updateDoc = op.data["$set"]
            ? op.data
            : { $set: { ...op.data, updated_at: new Date().toISOString() } };
          const res = await coll.updateOne(filter, updateDoc);
          return { data: res, error: null };
        }
        case "deleteOne": {
          const res = await coll.deleteOne(filter);
          return { data: res, error: null };
        }
        case "deleteMany": {
          const res = await coll.deleteMany(filter);
          return { data: res, error: null };
        }
        default:
          throw new Error(`Operación no soportada: ${op.operation}`);
      }
    } catch (err: any) {
      const formatted = formatMongoError(err);
      console.error(`[MongoDB Atlas] Error en operación '${op.operation}' sobre '${op.collection}':`, formatted.message);
      return { data: null, error: formatted.message };
    }
  });
