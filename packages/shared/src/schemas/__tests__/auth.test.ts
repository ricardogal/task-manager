import { describe, expect, it } from "vitest";
import { signupSchema, loginSchema, refreshSchema, authResponseSchema } from "../auth";

describe("signupSchema", () => {
  it("aceita signup válido", () => {
    expect(
      signupSchema.safeParse({
        email: "user@example.com",
        password: "SuperSenha123!",
        name: "Ricardo",
      }).success,
    ).toBe(true);
  });

  it("rejeita senha curta (< 8)", () => {
    expect(
      signupSchema.safeParse({
        email: "user@example.com",
        password: "abc",
        name: "Ricardo",
      }).success,
    ).toBe(false);
  });

  it("rejeita senha sem letra maiúscula", () => {
    expect(
      signupSchema.safeParse({
        email: "user@example.com",
        password: "abcabcabc",
        name: "Ricardo",
      }).success,
    ).toBe(false);
  });

  it("rejeita senha sem número", () => {
    expect(
      signupSchema.safeParse({
        email: "user@example.com",
        password: "SuperSenha",
        name: "Ricardo",
      }).success,
    ).toBe(false);
  });
});

describe("loginSchema", () => {
  it("aceita login válido", () => {
    expect(loginSchema.safeParse({ email: "user@example.com", password: "qualquer" }).success).toBe(
      true,
    );
  });
});

describe("refreshSchema", () => {
  it("aceita refresh token", () => {
    expect(refreshSchema.safeParse({ refreshToken: "abc.def.ghi" }).success).toBe(true);
  });

  it("rejeita refresh token vazio", () => {
    expect(refreshSchema.safeParse({ refreshToken: "" }).success).toBe(false);
  });
});

describe("authResponseSchema", () => {
  it("valida resposta completa", () => {
    expect(
      authResponseSchema.safeParse({
        user: {
          id: "clx1",
          email: "a@b.com",
          name: "A",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        accessToken: "a",
        refreshToken: "r",
      }).success,
    ).toBe(true);
  });
});
