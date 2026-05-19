import { describe, expect, it } from "vitest";
import { envSchema } from "../env.js";

describe("envSchema", () => {
  it("aceita env válido", () => {
    const result = envSchema.safeParse({
      NODE_ENV: "development",
      PORT: "3001",
      HOST: "0.0.0.0",
      LOG_LEVEL: "info",
      DATABASE_URL: "postgresql://u:p@localhost:5432/db",
      JWT_SECRET: "a".repeat(32),
      JWT_ACCESS_TTL: "15m",
      JWT_REFRESH_TTL: "7d",
      CORS_ORIGIN: "http://localhost:5173",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.PORT).toBe(3001);
    }
  });

  it("rejeita JWT_SECRET curto", () => {
    const result = envSchema.safeParse({
      NODE_ENV: "development",
      PORT: "3001",
      HOST: "0.0.0.0",
      LOG_LEVEL: "info",
      DATABASE_URL: "postgresql://u:p@localhost:5432/db",
      JWT_SECRET: "short",
      JWT_ACCESS_TTL: "15m",
      JWT_REFRESH_TTL: "7d",
      CORS_ORIGIN: "http://localhost:5173",
    });
    expect(result.success).toBe(false);
  });

  it("rejeita DATABASE_URL inválida", () => {
    const result = envSchema.safeParse({
      NODE_ENV: "development",
      PORT: "3001",
      HOST: "0.0.0.0",
      LOG_LEVEL: "info",
      DATABASE_URL: "not-a-url",
      JWT_SECRET: "a".repeat(32),
      JWT_ACCESS_TTL: "15m",
      JWT_REFRESH_TTL: "7d",
      CORS_ORIGIN: "http://localhost:5173",
    });
    expect(result.success).toBe(false);
  });
});
