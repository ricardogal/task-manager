import { describe, expect, it } from "vitest";
import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ConflictError,
  ForbiddenError,
} from "../errors.js";

describe("AppError", () => {
  it("guarda code, statusCode e message", () => {
    const e = new AppError("CUSTOM", "msg", 418);
    expect(e.code).toBe("CUSTOM");
    expect(e.statusCode).toBe(418);
    expect(e.message).toBe("msg");
  });

  it("NotFoundError → 404", () => {
    const e = new NotFoundError("Recurso");
    expect(e.statusCode).toBe(404);
    expect(e.code).toBe("NOT_FOUND");
    expect(e.message).toContain("Recurso");
  });

  it("UnauthorizedError → 401", () => {
    expect(new UnauthorizedError().statusCode).toBe(401);
  });

  it("ConflictError → 409", () => {
    expect(new ConflictError("dup").statusCode).toBe(409);
  });

  it("ForbiddenError → 403", () => {
    expect(new ForbiddenError().statusCode).toBe(403);
  });
});
