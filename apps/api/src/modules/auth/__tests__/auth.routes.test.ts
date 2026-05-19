import { describe, expect, it, beforeEach, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import type { AuthResponse } from "@taskboard/shared";
import { buildTestApp } from "../../../../test/helpers.js";
import { resetTestDb } from "../../../../test/db-utils.js";

let app: FastifyInstance;

beforeEach(async () => {
  await resetTestDb();
  if (!app) app = await buildTestApp();
});

afterAll(async () => {
  await app.close();
});

interface ErrorBody {
  error: { code: string; message: string };
}

describe("POST /api/v1/auth/signup", () => {
  it("201 com dados válidos", async () => {
    const r = await app.inject({
      method: "POST",
      url: "/api/v1/auth/signup",
      payload: { email: "a@b.com", password: "Senha12345", name: "Ricardo" },
    });
    expect(r.statusCode).toBe(201);
    const body = r.json<AuthResponse>();
    expect(body.user.email).toBe("a@b.com");
    expect(body.accessToken).toBeTruthy();
    expect(body.refreshToken).toBeTruthy();
  });

  it("400 com email inválido", async () => {
    const r = await app.inject({
      method: "POST",
      url: "/api/v1/auth/signup",
      payload: { email: "x", password: "Senha12345", name: "A" },
    });
    expect(r.statusCode).toBe(400);
    expect(r.json<ErrorBody>().error.code).toBe("VALIDATION_ERROR");
  });

  it("409 com email duplicado", async () => {
    await app.inject({
      method: "POST",
      url: "/api/v1/auth/signup",
      payload: { email: "a@b.com", password: "Senha12345", name: "A" },
    });
    const r = await app.inject({
      method: "POST",
      url: "/api/v1/auth/signup",
      payload: { email: "a@b.com", password: "Senha12345", name: "B" },
    });
    expect(r.statusCode).toBe(409);
  });
});

describe("POST /api/v1/auth/login", () => {
  it("200 com credenciais corretas", async () => {
    await app.inject({
      method: "POST",
      url: "/api/v1/auth/signup",
      payload: { email: "a@b.com", password: "Senha12345", name: "A" },
    });
    const r = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: "a@b.com", password: "Senha12345" },
    });
    expect(r.statusCode).toBe(200);
    expect(r.json<AuthResponse>().accessToken).toBeTruthy();
  });

  it("401 com senha errada", async () => {
    await app.inject({
      method: "POST",
      url: "/api/v1/auth/signup",
      payload: { email: "a@b.com", password: "Senha12345", name: "A" },
    });
    const r = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: "a@b.com", password: "Errada123" },
    });
    expect(r.statusCode).toBe(401);
  });
});

describe("POST /api/v1/auth/refresh", () => {
  it("200 com refresh válido", async () => {
    const signup = await app.inject({
      method: "POST",
      url: "/api/v1/auth/signup",
      payload: { email: "a@b.com", password: "Senha12345", name: "A" },
    });
    const { refreshToken } = signup.json<AuthResponse>();
    const r = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      payload: { refreshToken },
    });
    expect(r.statusCode).toBe(200);
  });
});

describe("POST /api/v1/auth/logout", () => {
  it("204 e revoga refresh", async () => {
    const signup = await app.inject({
      method: "POST",
      url: "/api/v1/auth/signup",
      payload: { email: "a@b.com", password: "Senha12345", name: "A" },
    });
    const { refreshToken } = signup.json<AuthResponse>();
    const r = await app.inject({
      method: "POST",
      url: "/api/v1/auth/logout",
      payload: { refreshToken },
    });
    expect(r.statusCode).toBe(204);
  });
});
