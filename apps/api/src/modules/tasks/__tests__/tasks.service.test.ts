import { describe, expect, it, beforeEach } from "vitest";
import { tasksService } from "../tasks.service.js";
import { testPrisma, resetTestDb, seedTestCategories } from "../../../../test/db-utils.js";
import { NotFoundError } from "../../../lib/errors.js";

async function mkUser(s = "") {
  return testPrisma.user.create({ data: { email: `u${s}@x.com`, name: "U", passwordHash: "x" } });
}

describe("tasksService", () => {
  beforeEach(async () => {
    await resetTestDb();
    await seedTestCategories();
  });

  it("create exige categoria existente", async () => {
    const u = await mkUser();
    await expect(
      tasksService.create(u.id, {
        title: "X",
        priority: "HIGH",
        categoryId: "nope",
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("update rejeita task de outro user", async () => {
    const u1 = await mkUser("1");
    const u2 = await mkUser("2");
    const cat = await testPrisma.category.findFirstOrThrow();
    const t = await tasksService.create(u1.id, {
      title: "X",
      priority: "LOW",
      categoryId: cat.id,
    });
    await expect(tasksService.update(u2.id, t.id, { title: "Hack" })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });
});
