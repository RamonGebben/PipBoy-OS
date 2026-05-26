import Fastify from "fastify";
import websocket from "@fastify/websocket";
import fastifyStatic from "@fastify/static";
import path from "node:path";
import fs from "node:fs";
import { getSystemInfo } from "./system.js";
import { registerWsRoute, attachGpio, broadcast, type InputEvent } from "./gpio.js";
import { loadSidecarConfig } from "./config.js";

const cfg = loadSidecarConfig();
const app = Fastify({
  logger: { level: process.env.PIPBOY_LOG ?? "info" },
  disableRequestLogging: true,
});

await app.register(websocket);
registerWsRoute(app);

app.get("/api/system", async () => getSystemInfo());

// Synthetic event injection — handy for development without GPIO.
app.post<{ Body: { event?: string } }>("/api/input", async (req, reply) => {
  const ev = req.body?.event as InputEvent | undefined;
  const VALID = new Set([
    "tab-next",
    "tab-prev",
    "select",
    "back",
    "scroll-up",
    "scroll-down",
  ]);
  if (!ev || !VALID.has(ev)) {
    reply.code(400);
    return { ok: false };
  }
  broadcast(ev);
  return { ok: true };
});

if (fs.existsSync(cfg.uiDist)) {
  await app.register(fastifyStatic, { root: path.resolve(cfg.uiDist), wildcard: false });
  app.setNotFoundHandler((req, reply) => {
    // SPA fallback for non-API routes
    if (req.url.startsWith("/api") || req.url.startsWith("/ws")) {
      reply.code(404).send({ error: "not found" });
      return;
    }
    reply.sendFile("index.html");
  });
  app.log.info({ uiDist: cfg.uiDist }, "serving static UI");
} else {
  app.log.warn({ uiDist: cfg.uiDist }, "UI dist not found — sidecar is API-only");
}

const detachGpio = await attachGpio(cfg.gpio, (m) => app.log.info(m));

const stop = async () => {
  app.log.info("shutting down");
  detachGpio();
  await app.close();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);

await app.listen({ host: "0.0.0.0", port: cfg.port });
