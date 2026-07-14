import { Hono } from "hono";
import { config } from "./config.js";
import { handleRoute as kr36 } from "./routes/36kr.js";
import { handleRoute as baidu } from "./routes/baidu.js";
import { handleRoute as bilibili } from "./routes/bilibili.js";
import { handleRoute as doubanMovie } from "./routes/douban-movie.js";
import { handleRoute as douyin } from "./routes/douyin.js";
import { handleRoute as hellogithub } from "./routes/hellogithub.js";
import { handleRoute as history } from "./routes/history.js";
import { handleRoute as hupu } from "./routes/hupu.js";
import { handleRoute as juejin } from "./routes/juejin.js";
import { handleRoute as ngabbs } from "./routes/ngabbs.js";
import { handleRoute as neteaseNews } from "./routes/netease-news.js";
import { handleRoute as qqNews } from "./routes/qq-news.js";
import { handleRoute as toutiao } from "./routes/toutiao.js";
import { handleRoute as weibo } from "./routes/weibo.js";
import { handleRoute as weread } from "./routes/weread.js";
import { handleRoute as zhihu } from "./routes/zhihu.js";
import type { ListContext, RouterData } from "./types.js";
import getRSS from "./utils/getRSS.js";

type RouteHandler = (context: ListContext, noCache: boolean) => Promise<RouterData>;

const routeHandlers: Record<string, RouteHandler> = {
  "36kr": kr36 as unknown as RouteHandler,
  baidu: baidu as unknown as RouteHandler,
  bilibili: bilibili as RouteHandler,
  "douban-movie": doubanMovie as unknown as RouteHandler,
  douyin: douyin as unknown as RouteHandler,
  hellogithub: hellogithub as RouteHandler,
  history: history as RouteHandler,
  hupu: hupu as RouteHandler,
  juejin: juejin as RouteHandler,
  ngabbs: ngabbs as unknown as RouteHandler,
  "netease-news": neteaseNews as unknown as RouteHandler,
  "qq-news": qqNews as unknown as RouteHandler,
  toutiao: toutiao as unknown as RouteHandler,
  weibo: weibo as unknown as RouteHandler,
  weread: weread as RouteHandler,
  zhihu: zhihu as unknown as RouteHandler,
};

const routeNames = Object.keys(routeHandlers);
const app = new Hono();

app.get("/all", (c) =>
  c.json({
    code: 200,
    count: routeNames.length,
    routes: routeNames.map((name) => ({ name, path: `/${name}` })),
  }),
);

app.get("/:route", async (c) => {
  const routeName = c.req.param("route");
  const handleRoute = routeHandlers[routeName];
  if (!handleRoute) return c.json({ code: 404, message: "Route Not Found" }, 404);
  if (c.req.query("cache") === "false") {
    return c.json({ code: 403, message: "Cache bypass is disabled on Cloudflare Workers" }, 403);
  }

  const listData = await handleRoute(c, false);
  const limit = c.req.query("limit");
  const parsedLimit = limit ? Number.parseInt(limit, 10) : undefined;
  if (parsedLimit && parsedLimit > 0 && listData.data.length > parsedLimit) {
    listData.total = parsedLimit;
    listData.data = listData.data.slice(0, parsedLimit);
  }

  if (c.req.query("rss") === "true" || config.RSS_MODE) {
    const rss = getRSS(listData);
    c.header("Content-Type", "application/xml; charset=utf-8");
    return c.body(rss);
  }

  return c.json({ code: 200, ...listData });
});

app.all("/:route", (c) => c.json({ code: 405, message: "Method Not Allowed" }, 405));

export default app;
