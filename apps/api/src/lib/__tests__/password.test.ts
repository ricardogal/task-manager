import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../password.js";

describe("password", () => {
  it("hash produz string diferente da senha", async () => {
    const hash = await hashPassword("MinhaSenha123");
    expect(hash).not.toBe("MinhaSenha123");
    expect(hash.length).toBeGreaterThan(20);
  });

  it("verify com senha correta retorna true", async () => {
    const hash = await hashPassword("MinhaSenha123");
    expect(await verifyPassword("MinhaSenha123", hash)).toBe(true);
  });

  it("verify com senha errada retorna false", async () => {
    const hash = await hashPassword("MinhaSenha123");
    expect(await verifyPassword("Errada", hash)).toBe(false);
  });
});
