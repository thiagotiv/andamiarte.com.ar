import { MongoClient, Db, Collection } from "mongodb";
import dns from "dns";

// Asegurar resolución de DNS en entornos Windows con resolvers locales que no manejan SRV de Atlas
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {
  // Ignorar en entornos restringidos
}

function getMongoUri(): string {
  const uri = process.env["MONGODB_URI"];
  if (!uri) {
    throw new Error(
      "[MongoDB Atlas] Error: La variable de entorno MONGODB_URI no está configurada. " +
      "Por favor define MONGODB_URI en tu archivo .env o en las variables de entorno del servidor."
    );
  }
  return uri;
}

function getDbName(): string {
  return process.env["MONGODB_DB_NAME"] || "andamiarte";
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export async function getMongoClient(): Promise<MongoClient> {
  if (global._mongoClientPromise) {
    try {
      return await global._mongoClientPromise;
    } catch {
      global._mongoClientPromise = undefined;
    }
  }

  const client = new MongoClient(getMongoUri(), {
    serverSelectionTimeoutMS: 4000,
    connectTimeoutMS: 4000,
  });

  const connectPromise = client.connect().catch((err: any) => {
    global._mongoClientPromise = undefined;
    if (
      err?.message?.includes("SSL alert number 80") ||
      err?.code === "ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR" ||
      err?.name === "MongoServerSelectionError"
    ) {
      console.error(
        "\n========================================================================\n" +
        "🚨 [MongoDB Atlas] ALERTA DE CONEXIÓN / IP NO AUTORIZADA:\n" +
        "MongoDB Atlas rechazó la conexión (SSL Alert 80 o Timeout).\n" +
        "Tu dirección IP actual no está habilitada en Network Access de Atlas.\n" +
        "SOLUCIÓN RÁPIDA:\n" +
        "1. Ingresa a https://cloud.mongodb.com\n" +
        "2. En el menú izquierdo ve a: Security -> Network Access\n" +
        "3. Haz clic en 'Add IP Address' y agrega '0.0.0.0/0' (Allow Access from Anywhere) o tu IP actual.\n" +
        "========================================================================\n"
      );
    }
    throw err;
  });

  global._mongoClientPromise = connectPromise;
  return connectPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(getDbName());
}

export async function getCollection<T extends Record<string, any> = Record<string, any>>(
  collectionName: string
): Promise<Collection<T>> {
  const db = await getDb();
  return db.collection<T>(collectionName);
}

// Inicializador de índices principales en MongoDB Atlas
let indexesInitialized = false;
export async function initMongoIndexes() {
  if (indexesInitialized) return;
  try {
    const db = await getDb();
    await Promise.all([
      db.collection("users").createIndex({ email: 1 }, { unique: true }),
      db.collection("users").createIndex({ google_id: 1 }, { sparse: true }),
      db.collection("post_likes").createIndex({ post_id: 1, user_id: 1 }, { unique: true }),
      db.collection("connections").createIndex({ requester_id: 1, receiver_id: 1 }, { unique: true }),
      db.collection("posts").createIndex({ created_at: -1 }),
      db.collection("post_comments").createIndex({ post_id: 1, created_at: 1 }),
      db.collection("notifications").createIndex({ user_id: 1, created_at: -1 }),
      db.collection("profiles").createIndex({ id: 1 }, { unique: true }),
    ]);
    indexesInitialized = true;
    console.log("[MongoDB Atlas] Índices inicializados correctamente en 'andamiarte'.");
  } catch (err) {
    console.warn("[MongoDB Atlas] Aviso al inicializar índices:", err);
  }
}
