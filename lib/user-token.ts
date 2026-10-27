export const USER_COOKIE_NAME = "hiphim_user_session";
export const PENDING_REGISTRATION_COOKIE_NAME = "hiphim_pending_registration";
const SESSION_MAX_AGE_SECONDS = 86400 * 30; // 30 days session
const SECRET_SALT = process.env.USER_JWT_SECRET || "hiphim_user_jwt_secret_salt_2026";

export interface UserSessionPayload {
  userId: string;
  email: string;
  expiresAt: number;
  name?: string;
  avatar?: string;
  role?: string;
  isVerified?: boolean;
}

export interface PendingRegistrationPayload {
  email: string;
  passwordHash: string;
  name: string;
  otp: string;
  expiresAt: number;
}

export async function createPendingRegistrationToken(payload: PendingRegistrationPayload): Promise<string> {
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = await generateHmac(encodedPayload, SECRET_SALT);
  return `${encodedPayload}.${signature}`;
}

export async function verifyPendingRegistrationToken(
  token: string | null | undefined
): Promise<PendingRegistrationPayload | null> {
  if (!token) return null;

  const separator = token.lastIndexOf(".");
  if (separator === -1) return null;

  const encodedPayload = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expectedSignature = await generateHmac(encodedPayload, SECRET_SALT);
  if (signature !== expectedSignature) return null;

  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload)) as PendingRegistrationPayload;
    if (!payload.email || !payload.passwordHash || !payload.otp || Date.now() > payload.expiresAt) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Creates an HMAC signed session token using Web Crypto API.
 * 100% compatible with Node.js and Next.js Edge Middleware.
 */
export async function createUserSessionToken(
  userId: string,
  email: string,
  profile?: Pick<UserSessionPayload, "name" | "avatar" | "role" | "isVerified">
): Promise<string> {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload: UserSessionPayload = { userId, email, expiresAt, ...profile };
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = await generateHmac(encodedPayload, SECRET_SALT);
  return `v2.${encodedPayload}.${signature}`;
}

/**
 * Verifies an HMAC signed session token using Web Crypto API.
 */
export async function verifyUserSessionToken(token: string | null | undefined): Promise<UserSessionPayload | null> {
  if (!token) return null;

  if (token.startsWith("v2.")) {
    const [, encodedPayload, signature] = token.split(".");
    if (!encodedPayload || !signature) return null;
    const expectedSignature = await generateHmac(encodedPayload, SECRET_SALT);
    if (signature !== expectedSignature) return null;

    try {
      const payload = JSON.parse(decodeBase64Url(encodedPayload)) as UserSessionPayload;
      if (!payload.userId || !payload.email || !payload.expiresAt || Date.now() > payload.expiresAt) {
        return null;
      }
      return payload;
    } catch {
      return null;
    }
  }

  const parts = token.split(":");
  if (parts.length !== 4) return null;

  const [userId, email, expiresAtStr, signature] = parts;
  const expiresAt = Number(expiresAtStr);
  if (isNaN(expiresAt) || Date.now() > expiresAt) {
    return null; // Token expired
  }

  const payload = `${userId}:${email}:${expiresAtStr}`;
  const expectedSig = await generateHmac(payload, SECRET_SALT);
  if (signature !== expectedSig) {
    return null; // Invalid signature
  }

  return { userId, email, expiresAt };
}

async function generateHmac(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  const hashArray = Array.from(new Uint8Array(sigBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function encodeBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return new TextDecoder().decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)));
}
