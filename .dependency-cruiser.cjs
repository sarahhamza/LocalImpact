/** L'architecture devient un test : `pnpm depcruise` doit passer en CI. */
module.exports = {
  forbidden: [
    {
      name: "domain-pur",
      severity: "error",
      comment: "Le domaine ne dépend de rien (ni framework, ni ORM, ni autre couche).",
      from: { path: "^packages/domain" },
      to: { path: "node_modules/(mongoose|next|react)|^packages/(application|infra|db)" },
    },
    {
      name: "application-sans-techno",
      severity: "error",
      comment: "Les use cases ne connaissent que le domaine et leurs ports.",
      from: { path: "^packages/application" },
      to: { path: "node_modules/(mongoose|next|react)|^packages/(infra|db)" },
    },
    {
      // le container est le SEUL fichier de apps/web autorisé à importer infra
      name: "presentation-sans-orm",
      severity: "error",
      from: { path: "^apps/web/src/(?!container)" },
      to: { path: "^packages/(db|infra)/" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.depcruise.json" },
    exclude: { path: "(\\.next|node_modules|dist|coverage)" },
  },
};
