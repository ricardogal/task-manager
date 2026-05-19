import type { FastifyInstance } from "fastify";
import { prisma } from "../../prisma.js";

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/healthz", { schema: { tags: ["health"] } }, () => ({ status: "ok" }));

  app.get("/readyz", { schema: { tags: ["health"] } }, async () => {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "ready" };
  });

  // await needed to satisfy @typescript-eslint/require-await for the outer async plugin
  await Promise.resolve();
}
