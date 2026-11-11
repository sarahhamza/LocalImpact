
import "server-only";

import {
  AuthenticateUser,
  RegisterUser,
} from "@acme/application";

import {
  BcryptPasswordHasher,
  SystemClock,
  createMongoRepositories,
} from "@acme/infra";

function dependencies() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI est manquant");
  }

  const { users } = createMongoRepositories(uri);

  return {
    users,
    hasher: new BcryptPasswordHasher(),
    clock: new SystemClock(),
  };
}

export function registerUser() {
  return new RegisterUser(dependencies());
}

export function authenticateUser() {
  return new AuthenticateUser(dependencies());
}