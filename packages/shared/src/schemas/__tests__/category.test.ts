import { describe, expect, it } from "vitest";
import { categorySchema, createCategorySchema } from "../category";

describe("categorySchema", () => {
  it("aceita categoria válida", () => {
    expect(
      categorySchema.safeParse({ id: "c1", name: "Desenvolvimento", icon: "code" }).success,
    ).toBe(true);
  });

  it("rejeita name vazio", () => {
    expect(categorySchema.safeParse({ id: "c1", name: "", icon: "code" }).success).toBe(false);
  });

  it("rejeita icon com caracteres especiais", () => {
    expect(categorySchema.safeParse({ id: "c1", name: "X", icon: "code!@#" }).success).toBe(false);
  });
});

describe("createCategorySchema", () => {
  it("não exige id", () => {
    expect(createCategorySchema.safeParse({ name: "Marketing", icon: "megaphone" }).success).toBe(
      true,
    );
  });
});
