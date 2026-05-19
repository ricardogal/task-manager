import type { FastifyInstance, FastifyError } from "fastify";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "../lib/errors.js";

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError, req, reply) => {
    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: { code: error.code, message: error.message, details: error.details },
      });
    }

    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Dados inválidos",
          details: error.errors.map((e) => ({ path: e.path.join("."), message: e.message })),
        },
      });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return reply.status(409).send({
          error: { code: "CONFLICT", message: "Recurso já existe", details: error.meta },
        });
      }
      if (error.code === "P2025") {
        return reply.status(404).send({
          error: { code: "NOT_FOUND", message: "Recurso não encontrado" },
        });
      }
    }

    if (error.validation) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: error.message,
          details: error.validation,
        },
      });
    }

    if (error.statusCode === 429) {
      return reply.status(429).send({
        error: { code: "RATE_LIMITED", message: "Muitas requisições, tente em alguns segundos" },
      });
    }

    req.log.error({ err: error }, "Unhandled error");
    return reply.status(500).send({
      error: { code: "INTERNAL", message: "Erro interno do servidor" },
    });
  });
}
