import mongoose from "mongoose";
import { ensureIndexes } from "./indexes";

interface Cache {
  uri: string | null;
  promise: Promise<typeof mongoose> | null;
}

// Cache sur globalThis : survit au rechargement à chaud de Next (dev) et aux invocations
// « chaudes » en serverless — sinon chaque requête ouvrirait une nouvelle connexion.
const g = globalThis as typeof globalThis & { __localimpactMongo?: Cache };
const cache: Cache = (g.__localimpactMongo ??= { uri: null, promise: null });

export async function connectMongo(uri: string): Promise<typeof mongoose> {
  if (cache.promise && cache.uri === uri) return cache.promise;
  if (cache.promise) await disconnectMongo(); // changement d'URI (tests)

  cache.uri = uri;
  cache.promise = mongoose
    .connect(uri, { bufferCommands: false, serverSelectionTimeoutMS: 10_000 })
    .then(async (m) => {
      await ensureIndexes();
      return m;
    })
    .catch((e) => {
      cache.promise = null; // permet de réessayer à la requête suivante
      cache.uri = null;
      throw e;
    });
  return cache.promise;
}

export async function disconnectMongo(): Promise<void> {
  cache.promise = null;
  cache.uri = null;
  await mongoose.disconnect();
}
