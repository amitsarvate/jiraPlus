import dotenv from "dotenv";
import path from "node:path";
import fastify from "fastify";
import jiraAuthRoutes from "./routes/jiraAuth";
import { startJiraSyncScheduler } from "./lib/jiraSync";

// Load env from repo root (when running from workspace or root) and fallback to api/.env
const envPaths = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(__dirname, "../../.env"),
  path.resolve(__dirname, "../.env")
];
envPaths.forEach((p) => dotenv.config({ path: p }));

const app = fastify({
  logger: true
});

app.get("/health", async () => {
  return { status: "ok" };
});

app.register(jiraAuthRoutes, { prefix: "/auth/jira" });

const port = Number(process.env.PORT) || 4000;
const host = process.env.HOST || "0.0.0.0";

app
  .listen({ port, host })
  .then(() => {
    app.log.info({ port, host }, "API server listening");
    startJiraSyncScheduler(app.log);
  })
  .catch((err) => {
    app.log.error(err, "Failed to start API server");
    process.exit(1);
  });
