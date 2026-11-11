import { beforeEach, describe, expect, it } from "vitest";
import { createTestContext, expectFail, expectOk, type TestContext } from "../testing";
import { CreateReport } from "./create-report";

let ctx: TestContext;
let uc: CreateReport;
beforeEach(() => {
  ctx = createTestContext();
  uc = new CreateReport({ reports: ctx.reports, users: ctx.users, photos: ctx.photos, clock: ctx.clock });
});
const valid = {
  title: "Lampe cassée couloir B",
  description: "La lampe du couloir ne fonctionne plus.",
  category: "LIGHTING",
  location: "Bâtiment B",
};
const photo = (over = {}) => ({ data: new Uint8Array([1, 2, 3]), contentType: "image/png", filename: "p.png", ...over });

describe("CreateReport", () => {
  it("crée un signalement NEW attribué à son auteur, puis le consulte", async () => {
    const author = await ctx.createUser("USER", "Amel");
    const dto = expectOk(await uc.execute(author, valid));
    expect(dto).toMatchObject({ status: "NEW", authorId: author.id, authorName: "Amel", supportCount: 0, photoUrl: null });
    expect(await ctx.reports.byId(dto.id as never)).not.toBeNull();
  });
  it("accepte une photo facultative", async () => {
    const author = await ctx.createUser();
    const dto = expectOk(await uc.execute(author, { ...valid, photo: photo() }));
    expect(dto.photoUrl).toBe("https://fake.cdn/p.png");
  });
  it("rejette les champs invalides sans rien enregistrer ni uploader", async () => {
    const author = await ctx.createUser();
    expect(expectFail(await uc.execute(author, { ...valid, title: "ab", photo: photo() }), "VALIDATION").field).toBe("title");
    expect(expectFail(await uc.execute(author, { ...valid, category: "X" }), "VALIDATION").field).toBe("category");
    expect(ctx.photos.uploads).toHaveLength(0);
    expect((await ctx.reports.stats()).total).toBe(0);
  });
  it("rejette une photo au mauvais format ou trop lourde", async () => {
    const author = await ctx.createUser();
    expectFail(await uc.execute(author, { ...valid, photo: photo({ contentType: "application/pdf" }) }), "VALIDATION");
    expectFail(await uc.execute(author, { ...valid, photo: photo({ data: new Uint8Array(5 * 1024 * 1024 + 1) }) }), "VALIDATION");
    expect((await ctx.reports.stats()).total).toBe(0);
  });
});
