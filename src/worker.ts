import app from "./app.cloudflare.js";
import {
  createCloudflareCacheProvider,
  type CloudflareKvNamespace,
} from "./utils/cache.cloudflare.js";
import { setCacheProvider } from "./utils/cache.js";

export interface Bindings {
  CACHE: CloudflareKvNamespace;
}

let activeNamespace: CloudflareKvNamespace | undefined;

export default {
  fetch(
    request: Request,
    env: Bindings,
    executionContext: Parameters<typeof app.fetch>[2],
  ): Promise<Response> {
    if (activeNamespace !== env.CACHE) {
      setCacheProvider(createCloudflareCacheProvider(env.CACHE));
      activeNamespace = env.CACHE;
    }
    return Promise.resolve(app.fetch(request, env, executionContext));
  },
};
