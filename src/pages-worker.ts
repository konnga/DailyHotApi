import app from "./app.cloudflare.js";
import {
  createCloudflareCacheProvider,
  type CloudflareKvNamespace,
} from "./utils/cache.cloudflare.js";
import { setCacheProvider } from "./utils/cache.js";

interface PagesAssetsBinding {
  fetch(request: Request): Promise<Response>;
}

export interface PagesBindings {
  ASSETS: PagesAssetsBinding;
  CACHE: CloudflareKvNamespace;
}

let activeNamespace: CloudflareKvNamespace | undefined;

export default {
  async fetch(
    request: Request,
    env: PagesBindings,
    executionContext: Parameters<typeof app.fetch>[2],
  ): Promise<Response> {
    if (request.method === "GET" || request.method === "HEAD") {
      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.status !== 404) return assetResponse;
    }

    if (activeNamespace !== env.CACHE) {
      setCacheProvider(createCloudflareCacheProvider(env.CACHE));
      activeNamespace = env.CACHE;
    }

    return app.fetch(request, env, executionContext);
  },
};
