import type { FastifyInstance } from "fastify";
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  taskStatusSchema,
  taskPrioritySchema,
} from "@taskboard/shared";
import { z } from "zod";
import { tasksService } from "./tasks.service.js";

const listQuerySchema = z.object({
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  categoryId: z.string().optional(),
});

const idParamsSchema = z.object({ id: z.string().min(1) });

export async function tasksRoutes(app: FastifyInstance): Promise<void> {
  await Promise.resolve();

  app.addHook("preHandler", app.authenticate);

  app.get(
    "/",
    { schema: { tags: ["tasks"], security: [{ bearerAuth: [] }], querystring: listQuerySchema } },
    async (req) => {
      const parsed = listQuerySchema.parse(req.query);
      const filters = Object.fromEntries(
        Object.entries(parsed).filter(([, v]) => v !== undefined),
      ) as Parameters<typeof tasksService.list>[1];
      return tasksService.list(req.userId, filters);
    },
  );

  app.get(
    "/:id",
    { schema: { tags: ["tasks"], security: [{ bearerAuth: [] }], params: idParamsSchema } },
    async (req) => {
      const { id } = idParamsSchema.parse(req.params);
      return tasksService.getById(req.userId, id);
    },
  );

  app.post(
    "/",
    { schema: { tags: ["tasks"], security: [{ bearerAuth: [] }], body: createTaskSchema } },
    async (req, reply) => {
      const input = createTaskSchema.parse(req.body);
      const created = await tasksService.create(req.userId, input);
      return reply.status(201).send(created);
    },
  );

  app.put(
    "/:id",
    {
      schema: {
        tags: ["tasks"],
        security: [{ bearerAuth: [] }],
        params: idParamsSchema,
        body: updateTaskSchema,
      },
    },
    async (req) => {
      const { id } = idParamsSchema.parse(req.params);
      const input = updateTaskSchema.parse(req.body);
      return tasksService.update(req.userId, id, input);
    },
  );

  app.patch(
    "/:id/status",
    {
      schema: {
        tags: ["tasks"],
        security: [{ bearerAuth: [] }],
        params: idParamsSchema,
        body: updateTaskStatusSchema,
      },
    },
    async (req) => {
      const { id } = idParamsSchema.parse(req.params);
      const { status } = updateTaskStatusSchema.parse(req.body);
      return tasksService.updateStatus(req.userId, id, status);
    },
  );

  app.delete(
    "/:id",
    { schema: { tags: ["tasks"], security: [{ bearerAuth: [] }], params: idParamsSchema } },
    async (req, reply) => {
      const { id } = idParamsSchema.parse(req.params);
      await tasksService.delete(req.userId, id);
      return reply.status(204).send();
    },
  );
}
