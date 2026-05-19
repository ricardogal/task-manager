import type { FastifyInstance, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { verifyAccessToken } from "../lib/jwt.js";
import { UnauthorizedError } from "../lib/errors.js";

declare module "fastify" {
  interface FastifyRequest {
    userId: string;
  }
  interface FastifyInstance {
    authenticate: (req: FastifyRequest) => void;
  }
}

export const authPlugin = fp((app: FastifyInstance) => {
  app.decorateRequest("userId", "");
  app.decorate("authenticate", (req: FastifyRequest) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedError("Authorization header ausente ou malformado");
    }
    const token = header.slice("Bearer ".length);
    const payload = verifyAccessToken(token);
    req.userId = payload.userId;
  });
});
