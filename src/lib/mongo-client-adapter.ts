import { mongoSignUpFn, mongoSignInFn, mongoCrudFn } from "./api-mongo";

export type AuthListener = (event: string, session: any) => void;

const listeners = new Set<AuthListener>();

export function notifyAuthListeners(event: string, session: any) {
  listeners.forEach((l) => {
    try {
      l(event, session);
    } catch (e) {
      console.warn("Auth listener error:", e);
    }
  });
}

// Almacenamiento local del usuario y token de MongoDB
export function getStoredSession() {
  if (typeof window === "undefined") return { user: null, token: null };
  try {
    const rawUser = localStorage.getItem("andamiarte_mongo_user");
    const token = localStorage.getItem("andamiarte_mongo_token");
    if (!token || !rawUser) return { user: null, token: null };
    return { user: JSON.parse(rawUser), token };
  } catch {
    return { user: null, token: null };
  }
}

export function setStoredSession(user: any, token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("andamiarte_mongo_user", JSON.stringify(user));
  localStorage.setItem("andamiarte_mongo_token", token);
}

export function clearStoredSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("andamiarte_mongo_user");
  localStorage.removeItem("andamiarte_mongo_token");
}

export const mongoAuth = {
  async signUp({
    email,
    password,
    options,
  }: {
    email: string;
    password: string;
    options?: { data?: Record<string, any>; emailRedirectTo?: string };
  }) {
    try {
      const res = await mongoSignUpFn({
        data: {
          email,
          password,
          role: (options?.data?.["role"] as string) || "aie",
          name: options?.data?.["name"] as string | undefined,
          phone: options?.data?.["phone"] as string | undefined,
          zone: options?.data?.["zone"] as string | undefined,
        },
      });

      const session = {
        access_token: res.token,
        token_type: "bearer",
        user: res.user,
      };

      setStoredSession(res.user, res.token);
      notifyAuthListeners("SIGNED_IN", session);

      return {
        data: { user: res.user, session },
        error: null,
      };
    } catch (err: any) {
      return {
        data: { user: null, session: null },
        error: { message: err?.message || "Error al registrarse en MongoDB" },
      };
    }
  },

  async signInWithPassword({ email, password }: { email: string; password: string }) {
    try {
      const res = await mongoSignInFn({
        data: { email, password },
      });

      const session = {
        access_token: res.token,
        token_type: "bearer",
        user: res.user,
      };

      setStoredSession(res.user, res.token);
      notifyAuthListeners("SIGNED_IN", session);

      return {
        data: { user: res.user, session },
        error: null,
      };
    } catch (err: any) {
      return {
        data: { user: null, session: null },
        error: { message: err?.message || "Error al iniciar sesión" },
      };
    }
  },

  async signOut() {
    clearStoredSession();
    notifyAuthListeners("SIGNED_OUT", null);
    return { error: null };
  },

  async getUser() {
    const { user } = getStoredSession();
    return { data: { user }, error: null };
  },

  async getSession() {
    const { user, token } = getStoredSession();
    if (!token || !user) return { data: { session: null }, error: null };
    return {
      data: {
        session: {
          access_token: token,
          token_type: "bearer",
          user,
        },
      },
      error: null,
    };
  },

  async setSession(tokens: { access_token?: string; user?: any }) {
    if (tokens?.access_token) {
      setStoredSession(tokens.user || null, tokens.access_token);
      notifyAuthListeners("SIGNED_IN", { access_token: tokens.access_token, user: tokens.user });
    }
    return { error: null };
  },

  async verifyOtp(_params: { email?: string; token?: string; type?: string; token_hash?: string }) {
    const { user, token } = getStoredSession();
    return {
      data: { user, session: { access_token: token, user } },
      error: null as { message: string } | null,
    };
  },

  async resend(_params: { email?: string; type?: string; options?: any }) {
    return { data: null, error: null as { message: string } | null };
  },

  async resetPasswordForEmail(_email: string, _options?: any) {
    return { data: null, error: null as { message: string } | null };
  },

  async updateUser(attributes: any) {
    const { user, token } = getStoredSession();
    if (user) {
      const updatedUser = { ...user, ...attributes };
      setStoredSession(updatedUser, token || "");
      notifyAuthListeners("USER_UPDATED", { access_token: token, user: updatedUser });
      return { data: { user: updatedUser }, error: null as { message: string } | null };
    }
    return { data: { user: null }, error: null as { message: string } | null };
  },

  onAuthStateChange(callback: AuthListener) {
    listeners.add(callback);
    // Disparar inmediatamente con el estado actual
    const { user, token } = getStoredSession();
    if (user && token) {
      setTimeout(() => callback("SIGNED_IN", { access_token: token, user }), 0);
    } else {
      setTimeout(() => callback("INITIAL_SESSION", null), 0);
    }
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            listeners.delete(callback);
          },
        },
      },
    };
  },
};

// Builder para simular la API de supabase.from() sobre colecciones MongoDB
export class MongoQueryBuilder<TRow = any> {
  private collectionName: string;
  private filters: Record<string, any> = {};
  private sortOptions?: Record<string, 1 | -1>;
  private limitNumber?: number;
  private pendingOperation: "select" | "insert" | "update" | "delete" = "select";
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
    this.filters[field] = value;
    return this;
  }

  is(field: string, value: any) {
    this.filters[field] = value;
    return this;
  }

  match(obj: Record<string, any>) {
    Object.assign(this.filters, obj);
    return this;
  }

  in(field: string, values: any[]) {
    this.filters[field] = { $in: values };
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

  single(): this {
    this.isSingle = true;
    return this;
  }

  maybeSingle(): this {
    this.isMaybeSingle = true;
    return this;
  }

  insert(data: any): this {
    this.pendingOperation = "insert";
    this.payloadData = data;
    return this;
  }

  update(data: any): this {
    this.pendingOperation = "update";
    this.payloadData = data;
    return this;
  }

  upsert(data: any, _options?: any): this {
    this.pendingOperation = "update";
    this.payloadData = data;
    return this;
  }

  delete(): this {
    this.pendingOperation = "delete";
    return this;
  }

  // Permite 'await supabase.from(...)' directamente gracias a Thenable
  async then<TResult1 = { data: TRow[] & TRow; error: any }, TResult2 = never>(
    resolve?: ((value: { data: any; error: any }) => TResult1 | PromiseLike<TResult1>) | null,
    reject?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    try {
      const result = await this.execute();
      if (resolve) return resolve(result as any);
      return result as any;
    } catch (err) {
      if (reject) return reject(err);
      return { data: null, error: err } as any;
    }
  }

  private async execute(): Promise<{ data: any; error: any }> {
    try {
      if (this.pendingOperation === "insert") {
        if (Array.isArray(this.payloadData)) {
          const inserted = [];
          for (const item of this.payloadData) {
            const res = (await mongoCrudFn({
              data: {
                collection: this.collectionName,
                operation: "insertOne",
                data: item,
              },
            })) as any;
            inserted.push(res?.data);
          }
          return { data: inserted, error: null };
        } else {
          const res = (await mongoCrudFn({
            data: {
              collection: this.collectionName,
              operation: "insertOne",
              data: this.payloadData,
            },
          })) as any;
          return { data: res?.data, error: null };
        }
      }

      if (this.pendingOperation === "update") {
        const res = (await mongoCrudFn({
          data: {
            collection: this.collectionName,
            operation: "updateOne",
            filter: this.filters,
            data: this.payloadData,
          },
        })) as any;
        return { data: res?.data, error: null };
      }

      if (this.pendingOperation === "delete") {
        const res = (await mongoCrudFn({
          data: {
            collection: this.collectionName,
            operation: "deleteMany",
            filter: this.filters,
          },
        })) as any;
        return { data: res?.data, error: null };
      }

      // SELECT
      if (this.isSingle || this.isMaybeSingle) {
        const res = (await mongoCrudFn({
          data: {
            collection: this.collectionName,
            operation: "findOne",
            filter: this.filters,
          },
        })) as any;
        if (this.isSingle && !res?.data) {
          return { data: null, error: { message: "No rows found" } };
        }
        return { data: res?.data, error: null };
      }

      const res = (await mongoCrudFn({
        data: {
          collection: this.collectionName,
          operation: "find",
          filter: this.filters,
          sort: this.sortOptions,
          limit: this.limitNumber,
        },
      })) as any;

      return { data: res?.data || [], error: null };
    } catch (err: any) {
      console.error(`[MongoQueryBuilder:${this.collectionName}] error:`, err);
      return { data: null, error: { message: err?.message || "Error en operación MongoDB" } };
    }
  }
}
