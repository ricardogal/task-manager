import { describe, expect, it } from "vitest";
import { commentSchema, createCommentSchema } from "../comment";

describe("commentSchema", () => {
  it("aceita comentário válido", () => {
    expect(
      commentSchema.safeParse({
        id: "cm1",
        taskId: "t1",
        content: "Olha só",
        author: "Ricardo",
        createdAt: new Date(),
      }).success,
    ).toBe(true);
  });
});

describe("createCommentSchema", () => {
  it("aceita conteúdo válido", () => {
    expect(createCommentSchema.safeParse({ content: "Comentário" }).success).toBe(true);
  });
  it("rejeita vazio", () => {
    expect(createCommentSchema.safeParse({ content: "" }).success).toBe(false);
  });
  it("rejeita > 1000 chars", () => {
    expect(createCommentSchema.safeParse({ content: "a".repeat(1001) }).success).toBe(false);
  });
});
