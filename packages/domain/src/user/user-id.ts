import { assertNonEmptyId, newId } from "../shared/id";

export type UserId = string & { readonly __brand: "UserId" };

export const UserId = {
  of: (value: string): UserId => assertNonEmptyId(value, "userId") as UserId,
  generate: (): UserId => newId() as UserId,
};
