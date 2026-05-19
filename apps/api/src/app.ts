import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import { env } from "./env.js";
import { loggerConfig } from "./plugins/logger.js";
import { registerErrorHandler } from "./plugins/error-handler.js";
import { authPlugin } from "./plugins/auth.js";
import { registerSwagger } from "./plugins/swagger.js";
import { healthRoutes } from "./modules/health/health.routes.js";

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: loggerConfig, disableRequestLogging: false });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, { origin: env.CORS_ORIGIN, credentials: true });
  await app.register(rateLimit, { max: 100, timeWindow: "1 minute" });
  await app.register(authPlugin);
  await registerSwagger(app);

  registerErrorHandler(app);

  await app.register(healthRoutes);

  return app;
}
