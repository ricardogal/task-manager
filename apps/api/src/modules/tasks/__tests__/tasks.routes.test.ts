import { describe, expect, it, beforeEach, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import type { AuthResponse } from "@taskboard/shared";
import { buildTestApp } from "../../../../test/helpers.js";
import { resetTestDb, seedTestCategories, testPrisma } from "../../../../test/db-utils.js";

interface TaskBody {
  id: string;
  title: string;
  status: string;
}

let app: FastifyInstance;
let token: string;
let categoryId: string;

beforeEach(async () => {
  await resetTestDb();
  await seedTestCategories();
  if (!app) app = await buildTestApp();
  const r = await app.inject({
    method: "POST",
    url: "/api/v1/auth/signup",
    payload: { email: "a@b.com", password: "Senha12345", name: "A" },
  });
  token = r.json<AuthResponse>().accessToken;
  const cat = await testPrisma.category.findFirstOrThrow();
  categoryId = cat.id;
});
afterAll(async () => {
  await app.close();
});

const auth = () => ({ authorization: `Bearer ${token}` });

describe("tasks routes", () => {
  it("POST /tasks → 201", async () => {
    const r = await app.inject({
      method: "POST",
      url: "/api/v1/tasks",
      headers: auth(),
      payload: { title: "Nova", priority: "HIGH", categoryId },
    });
    expect(r.statusCode).toBe(201);
    expect(r.json<TaskBody>().title).toBe("Nova");
  });

  it("POST /tasks → 400 quando título vazio", async () => {
    const r = await app.inject({
      method: "POST",
      url: "/api/v1/tasks",
      headers: auth(),
      payload: { title: "", priority: "HIGH", categoryId },
    });
    expect(r.statusCode).toBe(400);
  });

  it("GET /tasks lista só do user", async () => {
    await app.inject({
      method: "POST",
      url: "/api/v1/tasks",
      headers: auth(),
      payload: { title: "Minha", priority: "LOW", categoryId },
    });
    const r = await app.inject({ method: "GET", url: "/api/v1/tasks", headers: auth() });
    expect(r.statusCode).toBe(200);
    expect(r.json<TaskBody[]>()).toHaveLength(1);
  });

  it("PATCH /tasks/:id/status muda status", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/api/v1/tasks",
      headers: auth(),
      payload: { title: "X", priority: "LOW", categoryId },
    });
    const { id } = created.json<TaskBody>();
    const r = await app.inject({
      method: "PATCH",
      url: `/api/v1/tasks/${id}/status`,
      headers: auth(),
      payload: { status: "DONE" },
    });
    expect(r.statusCode).toBe(200);
    expect(r.json<TaskBody>().status).toBe("DONE");
  });

  it("DELETE /tasks/:id 204", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/api/v1/tasks",
      headers: auth(),
      payload: { title: "X", priority: "LOW", categoryId },
    });
    const { id } = created.json<TaskBody>();
    const r = await app.inject({
      method: "DELETE",
      url: `/api/v1/tasks/${id}`,
      headers: auth(),
    });
    expect(r.statusCode).toBe(204);
  });

  it("não acessa task de outro user", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/api/v1/tasks",
      headers: auth(),
      payload: { title: "X", priority: "LOW", categoryId },
    });
    const { id } = created.json<TaskBody>();
    const other = await app.inject({
      method: "POST",
      url: "/api/v1/auth/signup",
      payload: { email: "other@x.com", password: "Senha12345", name: "Other" },
    });
    const otherToken = other.json<AuthResponse>().accessToken;
    const r = await app.inject({
      method: "GET",
      url: `/api/v1/tasks/${id}`,
      headers: { authorization: `Bearer ${otherToken}` },
    });
    expect(r.statusCode).toBe(404);
  });
});
