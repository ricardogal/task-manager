import { describe, expect, it, beforeEach, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import type { AuthResponse, PublicUser } from "@taskboard/shared";
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

async function signupAndGetToken(): Promise<AuthResponse> {
  const r = await app.inject({
    method: "POST",
    url: "/api/v1/auth/signup",
    payload: { email: "a@b.com", password: "Senha12345", name: "Ricardo" },
  });
  return r.json<AuthResponse>();
}

describe("GET /api/v1/me", () => {
  it("200 com user logado", async () => {
    const { accessToken } = await signupAndGetToken();
    const r = await app.inject({
      method: "GET",
      url: "/api/v1/me",
      headers: { authorization: `Bearer ${accessToken}` },
    });
    expect(r.statusCode).toBe(200);
    expect(r.json<PublicUser>().email).toBe("a@b.com");
  });

  it("401 sem token", async () => {
    const r = await app.inject({ method: "GET", url: "/api/v1/me" });
    expect(r.statusCode).toBe(401);
  });

  it("401 com token inválido", async () => {
    const r = await app.inject({
      method: "GET",
      url: "/api/v1/me",
      headers: { authorization: "Bearer invalid" },
    });
    expect(r.statusCode).toBe(401);
  });
});
