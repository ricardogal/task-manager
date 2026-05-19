import type { FastifyInstance } from "fastify";
import { signupSchema, loginSchema, refreshSchema } from "@taskboard/shared";
import { authService } from "./auth.service.js";

export async function authRoutes(app: FastifyInstance): Promise<void> {
  await Promise.resolve();

  app.post("/signup", { schema: { tags: ["auth"], body: signupSchema } }, async (req, reply) => {
    const input = signupSchema.parse(req.body);
    const result = await authService.signup(input);
    return reply.status(201).send(result);
  });

  app.post("/login", { schema: { tags: ["auth"], body: loginSchema } }, async (req) => {
    const input = loginSchema.parse(req.body);
    return authService.login(input);
  });

  app.post("/refresh", { schema: { tags: ["auth"], body: refreshSchema } }, async (req) => {
    const { refreshToken } = refreshSchema.parse(req.body);
    return authService.refresh(refreshToken);
  });

  app.post("/logout", { schema: { tags: ["auth"], body: refreshSchema } }, async (req, reply) => {
    const { refreshToken } = refreshSchema.parse(req.body);
    await authService.logout(refreshToken);
    return reply.status(204).send();
  });
}
