import { describe, expect, it, beforeEach } from "vitest";
import { authRepository } from "../auth.repository.js";
import { testPrisma, resetTestDb } from "../../../../test/db-utils.js";

describe("authRepository", () => {
  beforeEach(async () => {
    await resetTestDb();
    await testPrisma.category.upsert({
      where: { name: "Desenvolvimento" },
      update: {},
      create: { name: "Desenvolvimento", icon: "code" },
    });
  });

  it("createUser persiste e retorna user sem passwordHash", async () => {
    const user = await authRepository.createUser({
      email: "a@b.com",
      name: "A",
      passwordHash: "hashed",
    });
    expect(user.email).toBe("a@b.com");
    expect(user).not.toHaveProperty("passwordHash");
  });

  it("findByEmail retorna user com hash", async () => {
    await authRepository.createUser({ email: "a@b.com", name: "A", passwordHash: "h" });
    const user = await authRepository.findByEmailWithHash("a@b.com");
    expect(user?.passwordHash).toBe("h");
  });

  it("createRefreshToken e findRefreshTokenByHash", async () => {
    const user = await authRepository.createUser({
      email: "a@b.com",
      name: "A",
      passwordHash: "h",
    });
    const expires = new Date(Date.now() + 60_000);
    const rt = await authRepository.createRefreshToken({
      userId: user.id,
      tokenHash: "thash",
      expiresAt: expires,
    });
    expect(rt.tokenHash).toBe("thash");
    const found = await authRepository.findRefreshTokenByHash("thash");
    expect(found?.id).toBe(rt.id);
  });

  it("revokeRefreshToken marca revokedAt", async () => {
    const user = await authRepository.createUser({
      email: "a@b.com",
      name: "A",
      passwordHash: "h",
    });
    const rt = await authRepository.createRefreshToken({
      userId: user.id,
      tokenHash: "thash",
      expiresAt: new Date(Date.now() + 60_000),
    });
    await authRepository.revokeRefreshToken(rt.id);
    const found = await authRepository.findRefreshTokenByHash("thash");
    expect(found?.revokedAt).toBeInstanceOf(Date);
  });

  it("revokeAllUserRefreshTokens revoga todos do user", async () => {
    const user = await authRepository.createUser({
      email: "a@b.com",
      name: "A",
      passwordHash: "h",
    });
    await authRepository.createRefreshToken({
      userId: user.id,
      tokenHash: "h1",
      expiresAt: new Date(Date.now() + 60_000),
    });
    await authRepository.createRefreshToken({
      userId: user.id,
      tokenHash: "h2",
      expiresAt: new Date(Date.now() + 60_000),
    });
    const count = await authRepository.revokeAllUserRefreshTokens(user.id);
    expect(count).toBe(2);
  });
});
