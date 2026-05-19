import { describe, expect, it, beforeEach } from "vitest";
import { tasksRepository } from "../tasks.repository.js";
import { testPrisma, resetTestDb, seedTestCategories } from "../../../../test/db-utils.js";

async function makeUser(suffix = "") {
  return testPrisma.user.create({
    data: { email: `u${suffix}@x.com`, name: "U", passwordHash: "x" },
  });
}

async function makeCategory() {
  return testPrisma.category.findFirstOrThrow();
}

describe("tasksRepository", () => {
  beforeEach(async () => {
    await resetTestDb();
    await seedTestCategories();
  });

  it("create + listByUser", async () => {
    const user = await makeUser();
    const cat = await makeCategory();
    await tasksRepository.create({
      userId: user.id,
      title: "T1",
      description: "",
      priority: "HIGH",
      categoryId: cat.id,
      dueDate: null,
    });
    const list = await tasksRepository.listByUser(user.id);
    expect(list).toHaveLength(1);
    expect(list[0]!.title).toBe("T1");
  });

  it("listByUser isola entre users", async () => {
    const u1 = await makeUser("1");
    const u2 = await makeUser("2");
    const cat = await makeCategory();
    await tasksRepository.create({
      userId: u1.id,
      title: "A",
      description: "",
      priority: "LOW",
      categoryId: cat.id,
      dueDate: null,
    });
    await tasksRepository.create({
      userId: u2.id,
      title: "B",
      description: "",
      priority: "LOW",
      categoryId: cat.id,
      dueDate: null,
    });
    expect(await tasksRepository.listByUser(u1.id)).toHaveLength(1);
  });

  it("findByIdForUser retorna null se for de outro user", async () => {
    const u1 = await makeUser("1");
    const u2 = await makeUser("2");
    const cat = await makeCategory();
    const t = await tasksRepository.create({
      userId: u1.id,
      title: "X",
      description: "",
      priority: "LOW",
      categoryId: cat.id,
      dueDate: null,
    });
    expect(await tasksRepository.findByIdForUser(t.id, u2.id)).toBeNull();
    expect(await tasksRepository.findByIdForUser(t.id, u1.id)).not.toBeNull();
  });

  it("update e updateStatus", async () => {
    const u = await makeUser();
    const cat = await makeCategory();
    const t = await tasksRepository.create({
      userId: u.id,
      title: "X",
      description: "",
      priority: "LOW",
      categoryId: cat.id,
      dueDate: null,
    });
    const upd = await tasksRepository.update(t.id, { title: "Y" });
    expect(upd.title).toBe("Y");
    const s = await tasksRepository.updateStatus(t.id, "DONE");
    expect(s.status).toBe("DONE");
  });

  it("delete remove", async () => {
    const u = await makeUser();
    const cat = await makeCategory();
    const t = await tasksRepository.create({
      userId: u.id,
      title: "X",
      description: "",
      priority: "LOW",
      categoryId: cat.id,
      dueDate: null,
    });
    await tasksRepository.delete(t.id);
    expect(await tasksRepository.findByIdForUser(t.id, u.id)).toBeNull();
  });
});
