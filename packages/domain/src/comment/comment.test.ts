import { describe, expect, it } from "vitest";
import { Comment } from "./comment";
import { ReportId } from "../report/report-id";
import { UserId } from "../user/user-id";
import { ValidationError } from "../shared/domain-error";

const base = { reportId: ReportId.generate(), authorId: UserId.generate(), now: new Date() };

describe("Comment.create", () => {
  it("nettoie le contenu", () => {
    expect(Comment.create({ ...base, content: "  Précision utile  " }).content).toBe("Précision utile");
  });
  it("rejette vide ou trop long", () => {
    expect(() => Comment.create({ ...base, content: "  " })).toThrow(ValidationError);
    expect(() => Comment.create({ ...base, content: "x".repeat(1001) })).toThrow(ValidationError);
  });
});
