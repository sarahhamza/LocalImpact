import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    globalSetup: ["./vitest.global-setup.ts"],
    testTimeout: 30_000,
    hookTimeout: 120_000, // 1er lancement : téléchargement du binaire MongoDB
  },
});
