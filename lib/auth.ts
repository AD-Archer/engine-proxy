const SESSION_COOKIE_NAME = "engine-proxy-session";
const REDIRECT_PARAM = "redirectTo";
const DEFAULT_REDIRECT_PATH = "/admin";

const textEncoder = new TextEncoder();

const arrayBufferToHex = (buffer: ArrayBuffer) => {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

export const getSessionCookieName = () => SESSION_COOKIE_NAME;
export const getRedirectParamName = () => REDIRECT_PARAM;
export const getDefaultRedirectPath = () => DEFAULT_REDIRECT_PATH;

export async function deriveSessionToken(username: string, password: string) {
  const credentialBlob = `${username}:${password}`;
  const digest = await crypto.subtle.digest(
    "SHA-256",
    textEncoder.encode(credentialBlob)
  );
  return arrayBufferToHex(digest);
}

export function sanitizeRedirectPath(path?: string | null) {
  if (!path) {
    return null;
  }

  if (!path.startsWith("/")) {
    return null;
  }

  if (path.startsWith("//")) {
    return null;
  }

  return path;
}

export async function hasValidSession(
  cookieValue: string | undefined,
  username: string,
  password: string
) {
  if (!cookieValue) {
    return false;
  }

  const expectedToken = await deriveSessionToken(username, password);
  return cookieValue === expectedToken;
}
