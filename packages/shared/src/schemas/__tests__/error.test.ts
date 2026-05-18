import { describe, expect, it } from "vitest";
import { apiErrorSchema, ErrorCode } from "../error";

describe("apiErrorSchema", () => {
  it("aceita erro simples", () => {
    expect(
      apiErrorSchema.safeParse({
        error: { code: "VALIDATION_ERROR", message: "Campo inválido" },
      }).success,
    ).toBe(true);
  });

  it("aceita erro com details", () => {
    expect(
      apiErrorSchema.safeParse({
        error: {
          code: "VALIDATION_ERROR",
          message: "X",
          details: [{ path: "email", message: "Email inválido" }],
        },
      }).success,
    ).toBe(true);
  });

  it("ErrorCode tem códigos esperados", () => {
    expect(ErrorCode.VALIDATION_ERROR).toBe("VALIDATION_ERROR");
    expect(ErrorCode.UNAUTHORIZED).toBe("UNAUTHORIZED");
    expect(ErrorCode.NOT_FOUND).toBe("NOT_FOUND");
    expect(ErrorCode.CONFLICT).toBe("CONFLICT");
    expect(ErrorCode.INTERNAL).toBe("INTERNAL");
    expect(ErrorCode.RATE_LIMITED).toBe("RATE_LIMITED");
  });
});
