import { describe, expect, it, beforeEach } from "vitest";
import { authService } from "../auth.service.js";
import { resetTestDb } from "../../../../test/db-utils.js";
import { UnauthorizedError, ConflictError } from "../../../lib/errors.js";

describe("authService", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  describe("signup", () => {
    it("cria user e retorna tokens", async () => {
      const r = await authService.signup({
        email: "a@b.com",
        password: "Senha12345",
        name: "Ricardo",
      });
      expect(r.user.email).toBe("a@b.com");
      expect(r.accessToken).toBeTruthy();
      expect(r.refreshToken).toBeTruthy();
    });

    it("rejeita email duplicado", async () => {
      await authService.signup({ email: "a@b.com", password: "Senha12345", name: "A" });
      await expect(
        authService.signup({ email: "a@b.com", password: "Senha12345", name: "B" }),
      ).rejects.toBeInstanceOf(ConflictError);
    });
  });

  describe("login", () => {
    it("retorna tokens com credenciais corretas", async () => {
      await authService.signup({ email: "a@b.com", password: "Senha12345", name: "A" });
      const r = await authService.login({ email: "a@b.com", password: "Senha12345" });
      expect(r.accessToken).toBeTruthy();
    });

    it("rejeita senha errada", async () => {
      await authService.signup({ email: "a@b.com", password: "Senha12345", name: "A" });
      await expect(
        authService.login({ email: "a@b.com", password: "Errada123" }),
      ).rejects.toBeInstanceOf(UnauthorizedError);
    });

    it("rejeita email inexistente", async () => {
      await expect(
        authService.login({ email: "ninguem@x.com", password: "Qualquer1" }),
      ).rejects.toBeInstanceOf(UnauthorizedError);
    });
  });

  describe("refresh", () => {
    it("rotaciona token: emite novo e revoga antigo", async () => {
      const initial = await authService.signup({
        email: "a@b.com",
        password: "Senha12345",
        name: "A",
      });
      const refreshed = await authService.refresh(initial.refreshToken);
      expect(refreshed.refreshToken).not.toBe(initial.refreshToken);
      expect(refreshed.accessToken).toBeTruthy();
      await expect(authService.refresh(initial.refreshToken)).rejects.toBeInstanceOf(
        UnauthorizedError,
      );
    });

    it("detecta reuso: revoga todos do user", async () => {
      const initial = await authService.signup({
        email: "a@b.com",
        password: "Senha12345",
        name: "A",
      });
      const rotated = await authService.refresh(initial.refreshToken);
      // tentar usar o antigo de novo
      await expect(authService.refresh(initial.refreshToken)).rejects.toBeInstanceOf(
        UnauthorizedError,
      );
      // o novo também deve ter sido revogado (proteção contra reuso)
      await expect(authService.refresh(rotated.refreshToken)).rejects.toBeInstanceOf(
        UnauthorizedError,
      );
    });
  });

  describe("logout", () => {
    it("revoga refresh token corrente", async () => {
      const initial = await authService.signup({
        email: "a@b.com",
        password: "Senha12345",
        name: "A",
      });
      await authService.logout(initial.refreshToken);
      await expect(authService.refresh(initial.refreshToken)).rejects.toBeInstanceOf(
        UnauthorizedError,
      );
    });
  });
});
