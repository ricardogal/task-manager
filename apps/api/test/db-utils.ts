import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";

const TEST_DB_URL =
  process.env.DATABASE_URL ??
  "postgresql://taskboard:taskboard@localhost:5432/taskboard_test?schema=public";

export const testPrisma = new PrismaClient({ datasources: { db: { url: TEST_DB_URL } } });

export function migrateTestDb(): void {
  execSync("pnpm prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: TEST_DB_URL },
    stdio: "inherit",
  });
}

export async function resetTestDb(): Promise<void> {
  await testPrisma.$transaction([
    testPrisma.comment.deleteMany(),
    testPrisma.task.deleteMany(),
    testPrisma.refreshToken.deleteMany(),
    testPrisma.user.deleteMany(),
  ]);
}

export async function seedTestCategories(): Promise<void> {
  const cats = [
    { name: "Desenvolvimento", icon: "code" },
    { name: "Design", icon: "palette" },
  ];
  for (const c of cats) {
    await testPrisma.category.upsert({ where: { name: c.name }, update: {}, create: c });
  }
}
