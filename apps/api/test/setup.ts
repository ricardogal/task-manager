process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-with-at-least-thirty-two-chars-long";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://taskboard:taskboard@localhost:5432/taskboard_test?schema=public";
process.env.CORS_ORIGIN = "http://localhost:5173";
