import { config } from "../config.js";

export interface CacheData {
  updateTime: string;
  data: unknown;
}

export interface CacheProvider {
  get(key: string): Promise<CacheData | undefined>;
  set(key: string, value: CacheData, ttl: number): Promise<boolean>;
  delete(key: string): Promise<boolean>;
}

type MemoryEntry = {
  expiresAt: number;
  value: CacheData;
};

const memoryCache = new Map<string, MemoryEntry>();

const memoryProvider: CacheProvider = {
  async get(key) {
    const entry = memoryCache.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      memoryCache.delete(key);
      return undefined;
    }
    return entry.value;
  },
  async set(key, value, ttl) {
    memoryCache.set(key, {
      expiresAt: Date.now() + ttl * 1000,
      value,
    });
    return true;
  },
  async delete(key) {
    return memoryCache.delete(key);
  },
};

let provider: CacheProvider = memoryProvider;

export const setCacheProvider = (nextProvider: CacheProvider): void => {
  provider = nextProvider;
};

export const getCache = (key: string): Promise<CacheData | undefined> => provider.get(key);

export const setCache = (
  key: string,
  value: CacheData,
  ttl: number = config.CACHE_TTL,
): Promise<boolean> => provider.set(key, value, ttl);

export const delCache = (key: string): Promise<boolean> => provider.delete(key);
