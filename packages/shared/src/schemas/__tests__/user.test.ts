import { describe, expect, it } from "vitest";
import { userSchema, publicUserSchema } from "../user";

describe("userSchema", () => {
  it("aceita user válido", () => {
    const result = userSchema.safeParse({
      id: "clx123abc",
      email: "user@example.com",
      name: "Ricardo",
      passwordHash: "$2b$12$abc",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(result.success).toBe(true);
  });

  it("rejeita email inválido", () => {
    const result = userSchema.safeParse({
      id: "clx123abc",
      email: "not-an-email",
      name: "Ricardo",
      passwordHash: "$2b$12$abc",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(result.success).toBe(false);
  });

  it("rejeita name vazio", () => {
    const result = userSchema.safeParse({
      id: "clx123abc",
      email: "user@example.com",
      name: "",
      passwordHash: "$2b$12$abc",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(result.success).toBe(false);
  });
});

describe("publicUserSchema", () => {
  it("não expõe passwordHash", () => {
    const result = publicUserSchema.parse({
      id: "clx123abc",
      email: "user@example.com",
      name: "Ricardo",
      passwordHash: "$2b$12$abc",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(result).not.toHaveProperty("passwordHash");
    expect(result).toMatchObject({
      id: "clx123abc",
      email: "user@example.com",
      name: "Ricardo",
    });
  });
});
