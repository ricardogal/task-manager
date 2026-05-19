import type { FastifyInstance } from "fastify";
import { usersService } from "./users.service.js";

export async function usersRoutes(app: FastifyInstance): Promise<void> {
  await Promise.resolve();

  app.get(
    "/me",
    { preHandler: [app.authenticate], schema: { tags: ["users"], security: [{ bearerAuth: [] }] } },
    async (req) => {
      return usersService.getById(req.userId);
    },
  );
}
