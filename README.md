# LocalImpact

Signalement et suivi des problèmes du quotidien — Clean Architecture + Monorepo (pnpm + Turborepo) + MongoDB.

## Démarrage rapide (étape 1)

```bash
pnpm install
cp .env.example .env && cp .env.example apps/web/.env.local   # puis éditer SESSION_SECRET
pnpm db:up          # MongoDB local (Docker)
pnpm dev            # http://localhost:3000
pnpm typecheck && pnpm lint && pnpm depcruise
```

Prérequis : Node ≥ 20.9 (voir `.nvmrc`), pnpm 10, Docker (optionnel si MongoDB Atlas).

README complet (comptes de démo, limites, déclaration IA) : étape 8.
