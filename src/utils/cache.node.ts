import { parse, stringify } from "flatted";
import Redis from "ioredis";
import NodeCache from "node-cache";
import { config } from "../config.js";
import logger from "./logger.js";
import type { CacheData, CacheProvider } from "./cache.js";

const cache = new NodeCache({
  stdTTL: config.CACHE_TTL,
  checkperiod: 600,
  useClones: false,
  maxKeys: 100,
});

const redis = new Redis({
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  password: config.REDIS_PASSWORD,
  db: config.REDIS_DB,
  maxRetriesPerRequest: 5,
  retryStrategy: (times) => Math.min(times * 50, 2000),
  lazyConnect: true,
});

let redisAvailable = false;
let redisTried = false;

const ensureRedisConnection = async (): Promise<void> => {
  if (redisTried) return;
  try {
    if (redis.status !== "ready" && redis.status !== "connecting") await redis.connect();
    redisAvailable = true;
    logger.info("📦 [Redis] connected successfully.");
  } catch (error) {
    redisAvailable = false;
    logger.error(
      `📦 [Redis] connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  } finally {
    redisTried = true;
  }
};

redis.on("error", (error) => {
  if (!redisTried) {
    redisAvailable = false;
    redisTried = true;
    logger.error(
      `📦 [Redis] connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
});

export const nodeCacheProvider: CacheProvider = {
  async get(key) {
    await ensureRedisConnection();
    if (redisAvailable) {
      try {
        const value = await redis.get(key);
        if (value) return parse(value) as CacheData;
      } catch (error) {
        logger.error(
          `📦 [Redis] get error: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }
    return cache.get<CacheData>(key);
  },

  async set(key, value, ttl) {
    if (redisAvailable && !Buffer.isBuffer(value.data)) {
      try {
        await redis.set(key, stringify(value), "EX", ttl);
      } catch (error) {
        logger.error(
          `📦 [Redis] set error: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }
    return cache.set(key, value, ttl);
  },

  async delete(key) {
    let redisDeleted = true;
    if (redisAvailable) {
      try {
        await redis.del(key);
      } catch (error) {
        redisDeleted = false;
        logger.error(
          `📦 [Redis] delete error: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }
    cache.del(key);
    return redisDeleted;
  },
};
