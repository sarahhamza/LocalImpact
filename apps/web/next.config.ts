import type { NextConfig } from "next";

const config: NextConfig = {
  // Les packages internes sont publiés en TypeScript brut (pas de build) :
  // Next doit donc les transpiler.
  transpilePackages: ["@acme/domain", "@acme/application", "@acme/infra", "@acme/db", "@acme/ui", "@acme/config"],
  // Mongoose / bcryptjs / cloudinary restent côté Node, non bundlés.
  serverExternalPackages: ["mongoose", "bcryptjs", "cloudinary"],
  images: { remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }] },
};

export default config;
