import { describe, expect, it, beforeEach, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "../../../../test/helpers.js";
import { resetTestDb, seedTestCategories, testPrisma } from "../../../../test/db-utils.js";

let app: FastifyInstance;
let token: string;
let taskId: string;

beforeEach(async () => {
  await resetTestDb();
  await seedTestCategories();
  if (!app) app = await buildTestApp();
  const r = await app.inject({
    method: "POST",
    url: "/api/v1/auth/signup",
    payload: { email: "a@b.com", password: "Senha12345", name: "Ricardo" },
  });
  token = r.json<{ accessToken: string }>().accessToken;
  const cat = await testPrisma.category.findFirstOrThrow();
  const t = await app.inject({
    method: "POST",
    url: "/api/v1/tasks",
    headers: { authorization: `Bearer ${token}` },
    payload: { title: "X", priority: "LOW", categoryId: cat.id },
  });
  taskId = t.json<{ id: string }>().id;
});
afterAll(async () => {
  await app.close();
});

const auth = () => ({ authorization: `Bearer ${token}` });

describe("comments", () => {
  it("POST → GET", async () => {
    const c = await app.inject({
      method: "POST",
      url: `/api/v1/tasks/${taskId}/comments`,
      headers: auth(),
      payload: { content: "primeiro comentário" },
    });
    expect(c.statusCode).toBe(201);
    expect(c.json<{ author: string }>().author).toBe("Ricardo");

    const list = await app.inject({
      method: "GET",
      url: `/api/v1/tasks/${taskId}/comments`,
      headers: auth(),
    });
    expect(list.statusCode).toBe(200);
    expect(list.json<unknown[]>()).toHaveLength(1);
  });

  it("DELETE comentário", async () => {
    const c = await app.inject({
      method: "POST",
      url: `/api/v1/tasks/${taskId}/comments`,
      headers: auth(),
      payload: { content: "x" },
    });
    const id = c.json<{ id: string }>().id;
    const del = await app.inject({
      method: "DELETE",
      url: `/api/v1/comments/${id}`,
      headers: auth(),
    });
    expect(del.statusCode).toBe(204);
  });

  it("não comenta em task de outro user", async () => {
    const other = await app.inject({
      method: "POST",
      url: "/api/v1/auth/signup",
      payload: { email: "x@y.com", password: "Senha12345", name: "Other" },
    });
    const otherToken = other.json<{ accessToken: string }>().accessToken;
    const r = await app.inject({
      method: "POST",
      url: `/api/v1/tasks/${taskId}/comments`,
      headers: { authorization: `Bearer ${otherToken}` },
      payload: { content: "hack" },
    });
    expect(r.statusCode).toBe(404);
  });
});
