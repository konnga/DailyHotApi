import { parse, stringify } from "flatted";
import type { CacheData, CacheProvider } from "./cache.js";

export interface CloudflareKvNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

export const createCloudflareCacheProvider = (namespace: CloudflareKvNamespace): CacheProvider => ({
  async get(key) {
    const value = await namespace.get(key);
    return value ? (parse(value) as CacheData) : undefined;
  },

  async set(key, value, ttl) {
    await namespace.put(key, stringify(value), {
      expirationTtl: Math.max(60, ttl),
    });
    return true;
  },

  async delete(key) {
    await namespace.delete(key);
    return true;
  },
});
