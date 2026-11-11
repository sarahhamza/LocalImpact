import { MongoMemoryServer } from "mongodb-memory-server";

let server: MongoMemoryServer | undefined;

/** Un seul mongod en mémoire pour toute la suite ; chaque fichier de test y crée sa propre base. */
export async function setup() {
  server = await MongoMemoryServer.create();
  process.env["MONGO_TEST_URI"] = server.getUri().replace(/\/$/, "");
}

export async function teardown() {
  await server?.stop();
}
