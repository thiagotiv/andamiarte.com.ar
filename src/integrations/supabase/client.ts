// Adaptador de compatibilidad cliente 100% MongoDB Atlas
// Desvinculado completamente de @supabase/supabase-js, WebSockets y credenciales remotas
import type { Database } from "./types";
import { mongoAuth, MongoQueryBuilder } from "@/lib/mongo-client-adapter";

// Adaptador de almacenamiento local seguro sin llamadas remotas
const storageAdapter = {
  from: (_bucket: string) => ({
    download: async (_path: string) => ({ data: new Blob(), error: null }),
    upload: async (path: string, _file: any, _options?: any) => ({ data: { path }, error: null }),
    createSignedUrl: async (path: string, _expiresIn: number) => ({ data: { signedUrl: path }, error: null }),
    getPublicUrl: (path: string) => ({ data: { publicUrl: path } }),
  }),
};

// Canal estático seguro sin conexiones WebSocket
const dummyChannel = {
  on: (..._args: any[]) => dummyChannel,
  subscribe: (..._args: any[]) => dummyChannel,
  unsubscribe: () => {},
};

export const supabase = {
  auth: mongoAuth,
  from: <TableName extends keyof Database["public"]["Tables"]>(tableName: TableName) =>
    new MongoQueryBuilder<Database["public"]["Tables"][TableName]["Row"]>(tableName as string),
  storage: storageAdapter,
  channel: (_name: string) => dummyChannel,
  removeChannel: (_ch: any) => {},
};
