import base from "@acme/config/eslint";

export default [
  ...base,
  {
    // Le domaine n'importe rien d'externe : seulement des chemins relatifs.
    files: ["src/**/*.ts"],
    ignores: ["src/**/*.test.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [{ regex: "^(?!\\.{1,2}/)", message: "Le domaine n'a AUCUNE dépendance : imports relatifs uniquement." }] },
      ],
    },
  },
];
