
import { redirect } from "next/navigation";
import { logoutAction } from "../../actions/auth.actions";
import { getSession } from "../../lib/session";

const roleLabels = {
  USER: "Utilisateur",
  MANAGER: "Responsable",
  ADMIN: "Administrateur",
};

export default async function WelcomePage() {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="li-welcome">
      <nav className="li-welcome-nav">
        <strong>
          localimpact<span>.</span>
        </strong>

        <form action={logoutAction}>
          <button type="submit">
            Se déconnecter ↗
          </button>
        </form>
      </nav>

      <section className="li-welcome-main">
        <span className="li-kicker">
          VOTRE ESPACE EST PRÊT
        </span>

        <h1>
          Bienvenue,
          <br />
          <em>{user.name}.</em>
        </h1>

        <p>
          Votre compte LocalImpact est actif.
          Vous pourrez bientôt créer des signalements,
          suivre leur progression et participer à
          l'amélioration de votre environnement.
        </p>

        <div className="li-user-badge">
          <span>RÔLE</span>
          <strong>{roleLabels[user.role]}</strong>

          <span>COMPTE</span>
          <strong>{user.email}</strong>
        </div>
      </section>
    </main>
  );
}
