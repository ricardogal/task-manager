import { buildApp } from "./app.js";
import { env } from "./env.js";

async function main(): Promise<void> {
  const app = await buildApp();
  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info({ docs: `http://localhost:${env.PORT}/docs` }, "API ready");
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

await main();
