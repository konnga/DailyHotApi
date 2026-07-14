import { serveStatic } from "@hono/node-server/serve-static";
import { createApp } from "./createApp.js";
import registry from "./registry.js";

const app = createApp({
  registry,
  staticMiddleware: serveStatic({
    root: "./public",
    rewriteRequestPath: (path) => (path === "/favicon.ico" ? "/favicon.png" : path),
  }),
});

export default app;
