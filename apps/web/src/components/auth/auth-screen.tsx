"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  loginAction,
  registerAction,
  type AuthState,
} from "../../actions/auth.actions";

type AuthMode = "login" | "register";

const initialState: AuthState = {
  message: "",
};

type FieldProps = {
  name: string;
  label: string;
  type?: string;
  placeholder: string;
  autocomplete: string;
  error?: string;
  children?: React.ReactNode;
};

function Field({
  name,
  label,
  type = "text",
  placeholder,
  autocomplete,
  error,
  children,
}: FieldProps) {
  return (
    <label className="li-field">
      <span className="li-field-label">{label}</span>

      <span
        className={
          "li-field-box" +
          (error ? " li-field-box-error" : "")
        }
      >
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          autoComplete={autocomplete}
          required
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? `${name}-error` : undefined
          }
        />

        {children}
      </span>

      {error && (
        <span
          className="li-field-error"
          id={`${name}-error`}
        >
          {error}
        </span>
      )}
    </label>
  );
}

function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      className={`li-brand ${
        light ? "li-brand-light" : "li-brand-dark"
      }`}
    >
      <span className="li-brand-symbol">
        <span className="li-brand-center" />
      </span>

      <span>
        localimpact<span className="li-brand-dot">.</span>
      </span>
    </Link>
  );
}

function CityIllustration() {
  return (
    <div className="li-artwork" aria-hidden="true">
      <div className="li-art-glow" />

      <div className="li-art-orbit li-art-orbit-1" />
      <div className="li-art-orbit li-art-orbit-2" />

      <div className="li-art-block li-art-block-a" />
      <div className="li-art-block li-art-block-b" />
      <div className="li-art-block li-art-block-c" />
      <div className="li-art-block li-art-block-d" />

      <span className="li-art-pin li-art-pin-1">✳</span>
      <span className="li-art-pin li-art-pin-2">✳</span>

      <span className="li-art-line" />

      <div className="li-art-bubble">
        <span className="li-art-bubble-icon">✓</span>

        <span>
          Un problème signalé.
          <strong> Une communauté qui avance.</strong>
        </span>
      </div>
    </div>
  );
}

export function AuthScreen({
  mode,
}: {
  mode: AuthMode;
}) {
  const isRegister = mode === "register";

  const [state, action, pending] = useActionState(
    isRegister ? registerAction : loginAction,
    initialState
  );

  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="li-auth-shell">
      <aside className="li-story-panel">
        <div className="li-story-top">
          <Brand light />

          <span className="li-story-overline">
            UNE COMMUNAUTÉ PLUS CONNECTÉE
          </span>
        </div>

        <CityIllustration />

        <div className="li-story-bottom">
          <span className="li-eyebrow">
            <span className="li-tiny-square" />
            ENSEMBLE, ON AGIT
          </span>

          <h1>
            Ensemble,
            <br />
            faisons bouger
            <br />
            <em>les choses.</em>
          </h1>

          <p>
            Signalez les problèmes de votre environnement,
            mobilisez votre communauté et suivez chaque
            amélioration en temps réel.
          </p>

          <div className="li-story-footer">
            <span>01 — SIGNALEZ</span>
            <span>02 — SUIVEZ</span>
            <span>03 — TRANSFORMEZ</span>
          </div>
        </div>
      </aside>

      <section className="li-form-panel">
        <header className="li-form-header">
          <div className="li-mobile-brand">
            <Brand />
          </div>

          <span className="li-header-caption">
            VOTRE ESPACE CITOYEN
          </span>

          <Link
            className="li-top-link"
            href={isRegister ? "/login" : "/register"}
          >
            {isRegister ? "Se connecter" : "Créer un compte"}
            <span aria-hidden="true"> ↗</span>
          </Link>
        </header>

        <div className="li-form-container">
          <div className="li-form-intro">
            <div className="li-kicker">
              <span className="li-kicker-line" />

              {isRegister
                ? "REJOIGNEZ LOCALIMPACT"
                : "BON RETOUR PARMI NOUS"}
            </div>

            <h2>
              {isRegister ? (
                <>
                  Votre impact
                  <br />
                  <em>commence ici.</em>
                </>
              ) : (
                <>
                  Heureux de vous
                  <br />
                  <em>retrouver.</em>
                </>
              )}
            </h2>

            <p>
              {isRegister
                ? "Créez votre compte pour signaler, soutenir et suivre les améliorations autour de vous."
                : "Connectez-vous pour retrouver vos signalements et participer au changement."}
            </p>
          </div>

          <form action={action} className="li-form">
            {isRegister && (
              <Field
                name="name"
                label="Nom complet"
                placeholder="Votre nom complet"
                autocomplete="name"
                error={state.errors?.name}
              />
            )}

            <Field
              name="email"
              label="Adresse e-mail"
              type="email"
              placeholder="vous@exemple.com"
              autocomplete="email"
              error={state.errors?.email}
            />

            <Field
              name="password"
              label="Mot de passe"
              type={showPassword ? "text" : "password"}
              placeholder={
                isRegister
                  ? "8 caractères minimum"
                  : "Votre mot de passe"
              }
              autocomplete={
                isRegister ? "new-password" : "current-password"
              }
              error={state.errors?.password}
            >
              <button
                type="button"
                className="li-password-toggle"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={
                  showPassword
                    ? "Masquer le mot de passe"
                    : "Afficher le mot de passe"
                }
              >
                {showPassword ? "Masquer" : "Afficher"}
              </button>
            </Field>

            {isRegister && (
              <p className="li-help-line">
                Votre compte sera créé avec le rôle
                <strong> utilisateur</strong>.
              </p>
            )}

            {state.message && (
              <div role="alert" className="li-form-alert">
                {state.message}
              </div>
            )}

            <button
              type="submit"
              className="li-submit"
              disabled={pending}
            >
              <span>
                {pending
                  ? "Traitement en cours..."
                  : isRegister
                    ? "Créer mon compte"
                    : "Se connecter"}
              </span>

              <span className="li-submit-arrow" aria-hidden="true">
                ↗
              </span>
            </button>
          </form>

          <p className="li-switch">
            {isRegister
              ? "Déjà membre de LocalImpact ? "
              : "Vous n'avez pas encore de compte ? "}

            <Link href={isRegister ? "/login" : "/register"}>
              {isRegister ? "Se connecter" : "S'inscrire"}
            </Link>
          </p>
        </div>

        <footer className="li-form-footer">
          <span>© {new Date().getFullYear()} LOCALIMPACT</span>
          <span>CONSTRUIT POUR LES COMMUNAUTÉS</span>
        </footer>
      </section>
    </main>
  );
}
