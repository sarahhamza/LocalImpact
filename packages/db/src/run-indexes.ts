// `pnpm db:indexes` : crée les index sur la base pointée par MONGODB_URI.
import { connectMongo, disconnectMongo } from "./connection";

const uri = process.env["MONGODB_URI"];
if (!uri) throw new Error("MONGODB_URI manquant (voir .env)");
await connectMongo(uri); // connectMongo crée aussi les index
await disconnectMongo();
console.warn("✓ index créés");
