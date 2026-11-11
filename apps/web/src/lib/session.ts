
import "server-only";

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { UserDto } from "@acme/application";

const COOKIE_NAME = "localimpact_session";
const MAX_AGE = 60 * 60 * 24 * 7;

type SessionUser = Pick<
  UserDto,
  "id" | "name" | "email" | "role"
>;

function sessionKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET doit contenir au moins 32 caractères"
    );
  }

  return new TextEncoder().encode(secret);
}

export async function createSession(
  user: SessionUser
): Promise<void> {
  const token = await new SignJWT({
    name: user.name,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(sessionKey());

  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function getSession():
  Promise<SessionUser | null> {
  const token = (await cookies()).get(
    COOKIE_NAME
  )?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(
      token,
      sessionKey(),
      { algorithms: ["HS256"] }
    );

    if (
      !payload.sub ||
      typeof payload.name !== "string" ||
      typeof payload.email !== "string" ||
      !["USER", "MANAGER", "ADMIN"].includes(
        String(payload.role)
      )
    ) {
      return null;
    }

    return {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      role: payload.role as SessionUser["role"],
    };
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  (await cookies()).delete(COOKIE_NAME);
}