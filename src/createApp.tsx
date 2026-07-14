import type { MiddlewareHandler } from "hono";
import { Hono } from "hono";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { prettyJSON } from "hono/pretty-json";
import { trimTrailingSlash } from "hono/trailing-slash";
import { config } from "./config.js";
import robotstxt from "./robots.txt.js";
import logger from "./utils/logger.js";
import Error from "./views/Error.js";
import Home from "./views/Home.js";
import NotFound from "./views/NotFound.js";

type CreateAppOptions = {
  registry: Hono;
  staticMiddleware?: MiddlewareHandler;
  compressResponses?: boolean;
};

export const createApp = ({
  registry,
  staticMiddleware,
  compressResponses = true,
}: CreateAppOptions): Hono => {
  const app = new Hono();

  if (compressResponses) app.use(compress());
  app.use(prettyJSON());
  app.use(trimTrailingSlash());
  app.use(
    "*",
    cors({
      origin: (origin) => {
        if (config.ALLOWED_DOMAIN === "*") return origin || "*";
        const isAllowedHost = config.ALLOWED_HOST && origin.endsWith(config.ALLOWED_HOST);
        return isAllowedHost ? origin : config.ALLOWED_DOMAIN;
      },
      allowMethods: ["POST", "GET", "OPTIONS"],
      allowHeaders: ["X-Custom-Header", "Upgrade-Insecure-Requests"],
      credentials: true,
    }),
  );

  if (staticMiddleware) app.use("/*", staticMiddleware);

  app.route("/", registry);
  app.get("/robots.txt", robotstxt);
  app.get("/", (c) => c.html(<Home />));
  app.notFound((c) => c.html(<NotFound />, 404));
  app.onError((error, c) => {
    logger.error(`❌ [ERROR] ${error.message}`);
    return c.html(<Error error={error.message} />, 500);
  });

  return app;
};
