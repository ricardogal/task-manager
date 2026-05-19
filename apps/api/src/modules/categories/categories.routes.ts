import type { FastifyInstance } from "fastify";
import { categoriesService } from "./categories.service.js";

export async function categoriesRoutes(app: FastifyInstance): Promise<void> {
  await Promise.resolve();

  app.get(
    "/categories",
    {
      preHandler: [app.authenticate],
      schema: { tags: ["categories"], security: [{ bearerAuth: [] }] },
    },
    async () => categoriesService.list(),
  );
}
