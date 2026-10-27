export const ADMIN_COOKIE_NAME = "hiphim_admin_session";
const SESSION_MAX_AGE_SECONDS = 86400 * 7; // 7 days
const SECRET_SALT = process.env.ADMIN_JWT_SECRET || "hiphim_admin_jwt_secret_salt_2026";

/**
 * Creates an HMAC signed session token using Web Crypto API.
 * 100% compatible with Node.js and Next.js Edge Middleware.
 */
export async function createSessionToken(username: string): Promise<string> {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `${username}:${expiresAt}`;
  const signature = await generateHmac(payload, SECRET_SALT);
  return `${payload}:${signature}`;
}

/**
 * Verifies an HMAC signed session token using Web Crypto API.
 * 100% compatible with Node.js and Next.js Edge Middleware.
 */
export async function verifySessionToken(token: string | null | undefined): Promise<boolean> {
  if (!token) return false;
  const parts = token.split(":");
  if (parts.length !== 3) return false;

  const [username, expiresAtStr, signature] = parts;
  const expiresAt = Number(expiresAtStr);
  if (isNaN(expiresAt) || Date.now() > expiresAt) {
    return false; // Token expired
  }

  const payload = `${username}:${expiresAtStr}`;
  const expectedSig = await generateHmac(payload, SECRET_SALT);
  return signature === expectedSig;
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
