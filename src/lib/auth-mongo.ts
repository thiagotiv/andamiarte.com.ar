import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getCollection, initMongoIndexes } from "./mongodb";

function getJwtSecret(): string {
  const secret = process.env["JWT_SECRET"];
  if (!secret) {
    throw new Error(
      "[Auth] Error: La variable de entorno JWT_SECRET no está configurada. " +
      "Por favor define JWT_SECRET en tu archivo .env o en las variables de entorno del servidor."
    );
  }
  return secret;
}

export interface MongoUserPayload {
  id: string;
  email: string;
  role: string;
  name?: string | undefined;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: MongoUserPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "30d" });
}

export function verifyToken(token: string): MongoUserPayload | null {
  try {
    const secret = process.env["JWT_SECRET"];
    if (!secret) return null;
    return jwt.verify(token, secret) as MongoUserPayload;
  } catch {
    return null;
  }
}

export async function registerMongoUser({
  email,
  password,
  role = "aie",
  name,
  phone = "",
  zone = "",
}: {
  email: string;
  password: string;
  role?: string | undefined;
  name?: string | undefined;
  phone?: string | undefined;
  zone?: string | undefined;
}) {
  await initMongoIndexes();
  const normalizedEmail = email.trim().toLowerCase();
  const usersColl = await getCollection<any>("users");
  const existing = await usersColl.findOne({ email: normalizedEmail });

  if (existing) {
    throw new Error("Ya existe una cuenta registrada con este correo electrónico.");
  }

  const userId = crypto.randomUUID();
  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();
  const userName = name?.trim() || normalizedEmail.split("@")[0];

  // 1. Guardar usuario
  await usersColl.insertOne({
    _id: userId,
    id: userId,
    email: normalizedEmail,
    password_hash: passwordHash,
    verified: true, // Modo simplificado: usuario verificado directamente
    created_at: now,
    updated_at: now,
  });

  // 2. Guardar perfil
  const profilesColl = await getCollection<any>("profiles");
  await profilesColl.insertOne({
    _id: userId,
    id: userId,
    name: userName,
    role,
    phone,
    zone,
    avatar_path: null,
    cv_path: null,
    bio: "",
    title: role === "aie" ? "Acompañante de Inclusión Escolar" : role === "centro" ? "Centro de Apoyo a la Inclusión" : "Familia",
    skills: [],
    education: [],
    experience: [],
    years_experience: 0,
    billing: "",
    available: true,
    public_profile: true,
    privacy_settings: {
      show_phone: true,
      show_dni: false,
      show_exact_location: true,
      public_profile_visible: true,
      family_needs_visibility: "public",
    },
    created_at: now,
    updated_at: now,
  });

  // 3. Guardar rol
  const userRolesColl = await getCollection<any>("user_roles");
  await userRolesColl.insertOne({
    _id: userId,
    user_id: userId,
    role,
    created_at: now,
  });

  const payload: MongoUserPayload = {
    id: userId,
    email: normalizedEmail,
    role,
    name: userName,
  };

  const token = generateToken(payload);

  return {
    user: {
      id: userId,
      email: normalizedEmail,
      role,
      name: userName,
    },
    token,
  };
}

export async function loginMongoUser({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  await initMongoIndexes();
  const normalizedEmail = email.trim().toLowerCase();
  const usersColl = await getCollection<any>("users");
  const user = await usersColl.findOne({ email: normalizedEmail });

  if (!user) {
    throw new Error("Credenciales inválidas. Comprobá tu correo y contraseña.");
  }

  const validPassword = await comparePassword(password, user["password_hash"]);
  if (!validPassword) {
    throw new Error("Credenciales inválidas. Comprobá tu correo y contraseña.");
  }

  const userId = user["id"] || user["_id"];
  const profilesColl = await getCollection<any>("profiles");
  const profile = await profilesColl.findOne({ id: userId });

  const rolesColl = await getCollection<any>("user_roles");
  const userRole = await rolesColl.findOne({ user_id: userId });

  const role = userRole?.["role"] || profile?.["role"] || "aie";
  const name = profile?.["name"] || normalizedEmail.split("@")[0];

  const payload: MongoUserPayload = {
    id: userId,
    email: user["email"],
    role,
    name,
  };

  const token = generateToken(payload);

  return {
    user: {
      id: userId,
      email: user["email"],
      role,
      name,
    },
    token,
  };
}

export async function getMongoUserById(userId: string) {
  const usersColl = await getCollection<any>("users");
  const user = await usersColl.findOne({ $or: [{ id: userId }, { _id: userId }] });
  if (!user) return null;

  const profilesColl = await getCollection<any>("profiles");
  const profile = await profilesColl.findOne({ $or: [{ id: userId }, { _id: userId }] });

  const rolesColl = await getCollection<any>("user_roles");
  const userRole = await rolesColl.findOne({ user_id: userId });

  return {
    id: user["id"] || user["_id"],
    email: user["email"],
    role: userRole?.["role"] || profile?.["role"] || "aie",
    name: profile?.["name"] || user["email"],
    profile,
  };
}
