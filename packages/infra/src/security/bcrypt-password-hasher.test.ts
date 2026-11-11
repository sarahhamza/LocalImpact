import { describe, expect, it } from "vitest";
import { BcryptPasswordHasher } from "./bcrypt-password-hasher";

describe("BcryptPasswordHasher", () => {
  const hasher = new BcryptPasswordHasher(4); // coût minimal : tests rapides
  it("hache sans stocker le mot de passe en clair, avec un sel différent à chaque fois", async () => {
    const [a, b] = await Promise.all([hasher.hash("motdepasse1"), hasher.hash("motdepasse1")]);
    expect(a).not.toContain("motdepasse1");
    expect(a).not.toBe(b);
  });
  it("vérifie le bon mot de passe et refuse les autres", async () => {
    const h = await hasher.hash("motdepasse1");
    expect(await hasher.verify("motdepasse1", h)).toBe(true);
    expect(await hasher.verify("autre", h)).toBe(false);
  });
});
