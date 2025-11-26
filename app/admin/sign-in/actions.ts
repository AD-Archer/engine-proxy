"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  deriveSessionToken,
  getDefaultRedirectPath,
  getSessionCookieName,
  sanitizeRedirectPath,
} from "@/lib/auth";

const hours12 = 60 * 60 * 12;

export type SignInState = {
  error?: string;
};

export async function authenticate(
  _: SignInState,
  formData: FormData
): Promise<SignInState> {
  const usernameInput = formData.get("username");
  const passwordInput = formData.get("password");
  const redirectInput = formData.get("redirectTo");

  const username =
    typeof usernameInput === "string" ? usernameInput.trim() : "";
  const password = typeof passwordInput === "string" ? passwordInput : "";
  const redirectTo =
    typeof redirectInput === "string"
      ? sanitizeRedirectPath(redirectInput)
      : null;

  if (!username || !password) {
    return { error: "Enter both username and password." };
  }

  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;

  if (!expectedUser || !expectedPassword) {
    return {
      error:
        "Admin credentials are not configured. Set ADMIN_USERNAME and ADMIN_PASSWORD.",
    };
  }

  if (username !== expectedUser || password !== expectedPassword) {
    return { error: "That username and password do not match." };
  }

  const token = await deriveSessionToken(expectedUser, expectedPassword);

  const cookieStore = await cookies();
  cookieStore.set({
    name: getSessionCookieName(),
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: hours12,
    path: "/",
  });

  redirect(redirectTo ?? getDefaultRedirectPath());

  return {};
}
