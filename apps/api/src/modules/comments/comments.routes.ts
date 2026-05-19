import type { FastifyInstance } from "fastify";
import { createCommentSchema } from "@taskboard/shared";
import { z } from "zod";
import { commentsService } from "./comments.service.js";

const idParams = z.object({ id: z.string().min(1) });

export async function commentsRoutes(app: FastifyInstance): Promise<void> {
  await Promise.resolve();

  app.addHook("preHandler", app.authenticate);

  app.get(
    "/tasks/:id/comments",
    { schema: { tags: ["comments"], security: [{ bearerAuth: [] }], params: idParams } },
    async (req) => {
      const { id } = idParams.parse(req.params);
      return commentsService.listByTask(req.userId, id);
    },
  );

  app.post(
    "/tasks/:id/comments",
    {
      schema: {
        tags: ["comments"],
        security: [{ bearerAuth: [] }],
        params: idParams,
        body: createCommentSchema,
      },
    },
    async (req, reply) => {
      const { id } = idParams.parse(req.params);
      const { content } = createCommentSchema.parse(req.body);
      const c = await commentsService.create(req.userId, id, content);
      return reply.status(201).send(c);
    },
  );

  app.delete(
    "/comments/:id",
    { schema: { tags: ["comments"], security: [{ bearerAuth: [] }], params: idParams } },
    async (req, reply) => {
      const { id } = idParams.parse(req.params);
      await commentsService.delete(req.userId, id);
      return reply.status(204).send();
    },
  );
}
