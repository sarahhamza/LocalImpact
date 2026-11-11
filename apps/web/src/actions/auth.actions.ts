
"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import {
  authenticateUser,
  registerUser,
} from "../lib/auth-service";

import {
  clearSession,
  createSession,
} from "../lib/session";

export type AuthState = {
  message: string;
  errors?: Record<string, string>;
};

const loginSchema = z.object({
  email: z.email("Adresse e-mail invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

const registerSchema = loginSchema.extend({
  name: z
    .string()
    .trim()
    .min(2, "Au moins 2 caractères")
    .max(80, "80 caractères maximum"),

  password: z
    .string()
    .min(8, "8 caractères minimum")
    .max(72, "72 caractères maximum"),
});

function validationErrors(
  error: z.ZodError
): AuthState {
  const errors: Record<string, string> = {};

  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");
    errors[field] ??= issue.message;
  }

  return {
    message: "Corrigez les champs indiqués.",
    errors,
  };
}

export async function loginAction(
  _state: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),

    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    return validationErrors(parsed.error);
  }

  try {
    const result = await authenticateUser().execute(
      parsed.data
    );

    if (!result.ok) {
      return {
        message: "Identifiants incorrects.",
      };
    }

    await createSession(result.value);
  } catch {
    return {
      message:
        "Service temporairement indisponible. Réessayez.",
    };
  }

  redirect("/welcome");
}

export async function registerAction(
  _state: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    name: String(formData.get("name") ?? ""),

    email: String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),

    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    return validationErrors(parsed.error);
  }

  try {
    const result = await registerUser().execute(
      parsed.data
    );

    if (!result.ok) {
      return {
        message: result.error.message,
        errors: result.error.field
          ? {
              [result.error.field]: result.error.message,
            }
          : undefined,
      };
    }

    await createSession(result.value);
  } catch {
    return {
      message:
        "Création du compte impossible pour le moment.",
    };
  }

  redirect("/welcome");
}

export async function logoutAction(): Promise<void> {
  await clearSession();
  redirect("/login");
}
