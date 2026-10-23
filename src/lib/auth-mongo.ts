import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { getCollection, initMongoIndexes } from "./mongodb";
import { sendOtpVerificationEmail } from "./email";

const googleAuthClient = new OAuth2Client();

export function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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

  // Generar código OTP de 6 dígitos numéricos y expiración a 10 minutos
  const verificationCode = generateOtpCode();
  const codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

  // 1. Guardar usuario con verificación pendiente
  await usersColl.insertOne({
    _id: userId,
    id: userId,
    email: normalizedEmail,
    password_hash: passwordHash,
    isVerified: false,
    verified: false,
    verificationCode,
    codeExpiresAt,
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
    onboarded: false,
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

  // 4. Enviar correo transaccional de verificación con Resend
  try {
    await sendOtpVerificationEmail({
      email: normalizedEmail,
      code: verificationCode,
      name: userName,
    });
  } catch (emailErr) {
    console.error("[Email Verification] Error al enviar código:", emailErr);
  }

  return {
    user: {
      id: userId,
      email: normalizedEmail,
      role,
      name: userName,
      isVerified: false,
    },
    token: null,
    requiresVerification: true,
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

  // Validación de verificación de correo
  const isVerified = user["isVerified"] ?? user["verified"] ?? false;
  if (!isVerified) {
    throw new Error(
      "Tu correo aún no fue verificado. Ingresá el código de 6 dígitos que enviamos a tu casilla para activar tu cuenta."
    );
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
      isVerified: true,
    },
    token,
  };
}

export async function verifyMongoOtp({
  email,
  code,
}: {
  email: string;
  code: string;
}) {
  await initMongoIndexes();
  const normalizedEmail = email.trim().toLowerCase();
  const cleanCode = code.trim();
  const usersColl = await getCollection<any>("users");
  const user = await usersColl.findOne({ email: normalizedEmail });

  if (!user) {
    throw new Error("No encontramos ninguna cuenta asociada a este correo electrónico.");
  }

  const userId = user["id"] || user["_id"];
  const profilesColl = await getCollection<any>("profiles");
  const profile = await profilesColl.findOne({ $or: [{ id: userId }, { _id: userId }] });
  const rolesColl = await getCollection<any>("user_roles");
  const userRole = await rolesColl.findOne({ user_id: userId });
  const role = userRole?.["role"] || profile?.["role"] || "aie";
  const name = profile?.["name"] || normalizedEmail.split("@")[0];

  // Si ya estaba verificado previamente
  if (user["isVerified"] === true) {
    const token = generateToken({ id: userId, email: normalizedEmail, role, name });
    return {
      user: { id: userId, email: normalizedEmail, role, name, isVerified: true },
      token,
    };
  }

  if (!user["verificationCode"]) {
    throw new Error("No hay un código de verificación activo. Por favor solicitá un nuevo código.");
  }

  if (String(user["verificationCode"]).trim() !== cleanCode) {
    throw new Error("El código de 6 dígitos ingresado es incorrecto.");
  }

  const now = new Date();
  if (user["codeExpiresAt"] && new Date(user["codeExpiresAt"]) < now) {
    throw new Error("El código de verificación ha expirado (validez de 10 minutos). Solicitá un nuevo código.");
  }

  // Al validar con éxito: actualiza a isVerified: true y elimina verificationCode y codeExpiresAt
  await usersColl.updateOne(
    { _id: user["_id"] },
    {
      $set: {
        isVerified: true,
        verified: true,
        updated_at: now.toISOString(),
      },
      $unset: {
        verificationCode: "",
        codeExpiresAt: "",
      },
    }
  );

  const token = generateToken({ id: userId, email: normalizedEmail, role, name });

  return {
    user: { id: userId, email: normalizedEmail, role, name, isVerified: true },
    token,
  };
}

export async function resendMongoOtp({ email }: { email: string }) {
  await initMongoIndexes();
  const normalizedEmail = email.trim().toLowerCase();
  const usersColl = await getCollection<any>("users");
  const user = await usersColl.findOne({ email: normalizedEmail });

  if (!user) {
    throw new Error("No encontramos ninguna cuenta registrada con este correo electrónico.");
  }

  if (user["isVerified"] === true) {
    return { success: true, message: "Tu cuenta ya está verificada. Podés iniciar sesión normalmente." };
  }

  const newCode = generateOtpCode();
  const codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  const now = new Date().toISOString();

  await usersColl.updateOne(
    { _id: user["_id"] },
    {
      $set: {
        verificationCode: newCode,
        codeExpiresAt,
        updated_at: now,
      },
    }
  );

  const userId = user["id"] || user["_id"];
  const profilesColl = await getCollection<any>("profiles");
  const profile = await profilesColl.findOne({ $or: [{ id: userId }, { _id: userId }] });
  const userName = profile?.["name"] || normalizedEmail.split("@")[0];

  await sendOtpVerificationEmail({
    email: normalizedEmail,
    code: newCode,
    name: userName,
  });

  return { success: true };
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

// =====================================================================
// AUTENTICACIÓN GOOGLE OAUTH 2.0 (GOOGLE IDENTITY SERVICES)
// =====================================================================

export interface GoogleTokenPayload {
  sub: string;
  email: string;
  name?: string | undefined;
  picture?: string | undefined;
  email_verified?: boolean | undefined;
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleTokenPayload> {
  const clientId = process.env["GOOGLE_CLIENT_ID"] || process.env["VITE_GOOGLE_CLIENT_ID"];

  // Fallback para entornos de desarrollo si se usa token mock
  if (process.env["NODE_ENV"] !== "production" && idToken.startsWith("dev-mock-google-token:")) {
    const parts = idToken.split(":");
    return {
      sub: parts[1] || "mock-google-sub",
      email: (parts[2] || "dev@andamiarte.com").toLowerCase(),
      name: parts[3] || "Usuario Google Dev",
      picture: "https://lh3.googleusercontent.com/a/default-user",
      email_verified: true,
    };
  }

  if (!clientId) {
    throw new Error(
      "La variable de entorno GOOGLE_CLIENT_ID no está configurada en el servidor. " +
      "Por favor configúrala en tu archivo .env con el Client ID de Google Cloud Console."
    );
  }

  const ticket = await googleAuthClient.verifyIdToken({
    idToken,
    audience: clientId,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.email || !payload.sub) {
    throw new Error("Token de Google inválido: no contiene los datos requeridos (email / sub).");
  }

  return {
    sub: payload.sub,
    email: payload.email.trim().toLowerCase(),
    name: payload.name || payload.given_name || payload.email.split("@")[0],
    picture: payload.picture,
    email_verified: payload.email_verified,
  };
}

export async function loginOrRegisterWithGoogle({
  credential,
  role = "aie",
}: {
  credential: string;
  role?: string | undefined;
}) {
  await initMongoIndexes();
  const googleData = await verifyGoogleIdToken(credential);
  const normalizedEmail = googleData.email.trim().toLowerCase();

  const usersColl = await getCollection<any>("users");
  const profilesColl = await getCollection<any>("profiles");
  const userRolesColl = await getCollection<any>("user_roles");

  // Buscar por google_id, googleId o email
  const existingUser = await usersColl.findOne({
    $or: [
      { google_id: googleData.sub },
      { googleId: googleData.sub },
      { email: normalizedEmail },
    ],
  });

  const now = new Date().toISOString();
  let userId: string;
  let userRole = role || "aie";
  let userName = googleData.name || normalizedEmail.split("@")[0];
  let isNewUser = false;

  if (existingUser) {
    userId = existingUser["id"] || existingUser["_id"];

    // Actualizar último login y asegurar estado verificado por Google
    const updateFields: Record<string, any> = {
      isVerified: true,
      verified: true,
      last_login: now,
      updated_at: now,
    };
    if (!existingUser["google_id"] && !existingUser["googleId"]) {
      updateFields["google_id"] = googleData.sub;
      updateFields["googleId"] = googleData.sub;
    }
    if (googleData.picture && !existingUser["picture"]) {
      updateFields["picture"] = googleData.picture;
    }
    await usersColl.updateOne({ _id: existingUser["_id"] }, { $set: updateFields });

    // Cargar rol y perfil existentes
    const existingRoleDoc = await userRolesColl.findOne({ user_id: userId });
    const existingProfile = await profilesColl.findOne({ $or: [{ id: userId }, { _id: userId }] });

    if (existingRoleDoc?.["role"]) {
      userRole = existingRoleDoc["role"];
    } else if (existingProfile?.["role"]) {
      userRole = existingProfile["role"];
    }
    if (existingProfile?.["name"]) {
      userName = existingProfile["name"];
    }

    // Si el perfil no tiene avatar y Google nos proveyó picture, actualizarlo
    if (googleData.picture && (!existingProfile?.["avatar_path"] || existingProfile["avatar_path"] === "")) {
      await profilesColl.updateOne(
        { $or: [{ id: userId }, { _id: userId }] },
        { $set: { avatar_path: googleData.picture, updated_at: now } }
      );
    }
  } else {
    // Usuario nuevo: registrar con estado inicial para seleccionar rol o completar perfil
    isNewUser = true;
    userId = crypto.randomUUID();

    // 1. Guardar usuario
    await usersColl.insertOne({
      _id: userId,
      id: userId,
      email: normalizedEmail,
      google_id: googleData.sub,
      googleId: googleData.sub,
      name: userName,
      picture: googleData.picture || null,
      auth_provider: "google",
      isVerified: true,
      verified: true,
      last_login: now,
      created_at: now,
      updated_at: now,
    });

    // 2. Guardar perfil inicial con onboarded: false (dispara OnboardingGate)
    await profilesColl.insertOne({
      _id: userId,
      id: userId,
      name: userName,
      role: userRole,
      phone: "",
      zone: "",
      avatar_path: googleData.picture || null,
      cv_path: null,
      bio: "",
      title:
        userRole === "aie"
          ? "Acompañante de Inclusión Escolar"
          : userRole === "centro"
          ? "Centro de Apoyo a la Inclusión"
          : "Familia",
      skills: [],
      education: [],
      experience: [],
      years_experience: 0,
      billing: "",
      available: true,
      public_profile: true,
      onboarded: false,
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

    // 3. Guardar rol inicial
    await userRolesColl.insertOne({
      _id: userId,
      user_id: userId,
      role: userRole,
      created_at: now,
    });
  }

  const payload: MongoUserPayload = {
    id: userId,
    email: normalizedEmail,
    role: userRole,
    name: userName,
  };

  const token = generateToken(payload);

  return {
    user: {
      id: userId,
      email: normalizedEmail,
      role: userRole,
      name: userName,
      picture: googleData.picture,
    },
    token,
    isNewUser,
  };
}
