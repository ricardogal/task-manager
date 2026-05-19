import { describe, expect, it, beforeEach, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import type { AuthResponse, Category } from "@taskboard/shared";
import { buildTestApp } from "../../../../test/helpers.js";
import { resetTestDb, seedTestCategories } from "../../../../test/db-utils.js";

let app: FastifyInstance;

beforeEach(async () => {
  await resetTestDb();
  await seedTestCategories();
  if (!app) app = await buildTestApp();
});
afterAll(async () => {
  await app.close();
});

async function tokenize() {
  const r = await app.inject({
    method: "POST",
    url: "/api/v1/auth/signup",
    payload: { email: "a@b.com", password: "Senha12345", name: "A" },
  });
  return r.json<AuthResponse>().accessToken;
}

describe("GET /api/v1/categories", () => {
  it("401 sem auth", async () => {
    const r = await app.inject({ method: "GET", url: "/api/v1/categories" });
    expect(r.statusCode).toBe(401);
  });

  it("200 com lista de categorias seedadas", async () => {
    const token = await tokenize();
    const r = await app.inject({
      method: "GET",
      url: "/api/v1/categories",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(r.statusCode).toBe(200);
    const list = r.json<Category[]>();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThanOrEqual(2);
    expect(list[0]).toHaveProperty("name");
    expect(list[0]).toHaveProperty("icon");
  });
});
