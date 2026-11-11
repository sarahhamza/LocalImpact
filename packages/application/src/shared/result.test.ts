import { ValidationError } from "@acme/domain";
import { describe, expect, it } from "vitest";
import { NonAutorise } from "./errors";
import { guard } from "./result";

describe("guard", () => {
  it("renvoie un succès", async () => {
    expect(await guard(async () => 42)).toEqual({ ok: true, value: 42 });
  });
  it("convertit les erreurs métier et applicatives en échec", async () => {
    const r1 = await guard(async () => { throw new NonAutorise(); });
    expect(r1).toMatchObject({ ok: false, error: { code: "NON_AUTORISE" } });
    const r2 = await guard(async () => { throw new ValidationError("title", "trop court"); });
    expect(r2).toMatchObject({ ok: false, error: { code: "VALIDATION", field: "title" } });
  });
  it("laisse remonter les erreurs inattendues (bugs, base indisponible)", async () => {
    await expect(guard(async () => { throw new Error("boom"); })).rejects.toThrow("boom");
  });
});
