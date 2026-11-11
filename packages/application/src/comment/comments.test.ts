import { ReportId } from "@acme/domain";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestContext, expectFail, expectOk, type TestContext } from "../testing";
import { AddComment } from "./add-comment";
import { ListComments } from "./list-comments";

let ctx: TestContext;
let add: AddComment;
let list: ListComments;
beforeEach(() => {
  ctx = createTestContext();
  add = new AddComment({ reports: ctx.reports, comments: ctx.comments, users: ctx.users, clock: ctx.clock });
  list = new ListComments({ reports: ctx.reports, comments: ctx.comments, users: ctx.users });
});

describe("AddComment / ListComments", () => {
  it("ajoute puis liste les commentaires dans l'ordre, avec le nom de l'auteur", async () => {
    const amel = await ctx.createUser("USER", "Amel");
    const karim = await ctx.createUser("MANAGER", "Karim");
    const r = await ctx.createReport(amel);
    expectOk(await add.execute(karim, { reportId: r.id, content: "Pouvez-vous préciser l'étage ?" }));
    ctx.clock.advance(1000);
    expectOk(await add.execute(amel, { reportId: r.id, content: "  2e étage  " }));

    const res = expectOk(await list.execute(amel, r.id));
    expect(res.map((c) => [c.authorName, c.content])).toEqual([
      ["Karim", "Pouvez-vous préciser l'étage ?"],
      ["Amel", "2e étage"],
    ]);
  });
  it("rejette un commentaire vide ou trop long", async () => {
    const u = await ctx.createUser();
    const r = await ctx.createReport(u);
    expect(expectFail(await add.execute(u, { reportId: r.id, content: " " }), "VALIDATION").field).toBe("content");
    expectFail(await add.execute(u, { reportId: r.id, content: "x".repeat(1001) }), "VALIDATION");
    expect(ctx.comments.items).toHaveLength(0);
  });
  it("INTROUVABLE si le signalement n'existe pas", async () => {
    const u = await ctx.createUser();
    expectFail(await add.execute(u, { reportId: ReportId.generate(), content: "ok" }), "INTROUVABLE");
    expectFail(await list.execute(u, ReportId.generate()), "INTROUVABLE");
  });
});
