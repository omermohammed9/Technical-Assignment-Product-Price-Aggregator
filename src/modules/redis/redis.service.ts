import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * @file redis.service.ts
 * @description Custom Redis cache service wrap around ioredis.
 * Implements fault-tolerant logic where operations return fallback default values
 * instead of throwing exceptions if Redis is temporarily unreachable.
 * Supports pattern-based scan invalidation.
 * @module RedisService
 */

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly redis: Redis | null = null;
  private isConnected = false;

  /**
   * Initializes the Redis Client.
   * Parses the host connection string and sets up listeners for network events to maintain connection state.
   */
  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    try {
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 1, // Fail fast to avoid hanging on down connection
        reconnectOnError: () => true,
      });

      this.redis.on('connect', () => {
        this.isConnected = true;
        this.logger.log('Redis connected successfully.');
      });

      this.redis.on('error', (err) => {
        this.isConnected = false;
        this.logger.warn(`Redis connection error/unavailable: ${err.message}`);
      });
    } catch (err) {
      this.logger.error('Failed to initialize Redis client', err);
      this.redis = null;
      this.isConnected = false;
    }
  }

  /**
   * Retrieves a cached value from Redis by key.
   * Tolerates Redis failure by returning null instead of throwing.
   *
   * @param {string} key - Cache key
   * @returns {Promise<string | null>} The parsed cached string value or null if miss/unreachable
   */
  async get(key: string): Promise<string | null> {
    if (!this.redis || !this.isConnected) {
      return null;
    }
    try {
      return await this.redis.get(key);
    } catch (err) {
      this.logger.error(`Error reading key "${key}" from Redis`, err);
      return null;
    }
  }

  /**
   * Caches a value in Redis with an optional TTL.
   * Tolerates Redis failure gracefully.
   *
   * @param {string} key - Cache key
   * @param {string} value - String value to store
   * @param {number} [ttlSeconds] - Time-to-Live expiration window in seconds
   * @returns {Promise<void>}
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.redis || !this.isConnected) {
      return;
    }
    try {
      if (ttlSeconds) {
        await this.redis.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.redis.set(key, value);
      }
    } catch (err) {
      this.logger.error(`Error writing key "${key}" to Redis`, err);
    }
  }

  /**
   * Deletes a key from Redis.
   *
   * @param {string} key - Target cache key to invalidate
   * @returns {Promise<void>}
   */
  async del(key: string): Promise<void> {
    if (!this.redis || !this.isConnected) {
      return;
    }
    try {
      await this.redis.del(key);
    } catch (err) {
      this.logger.error(`Error deleting key "${key}" from Redis`, err);
    }
  }

  /**
   * Deletes keys matching a wildcard pattern (e.g. "products:list:*") safely using SCAN.
   * Avoids blocking the single-threaded Redis process that standard KEYS command causes.
   *
   * @param {string} pattern - Wildcard pattern string to match keys
   * @returns {Promise<void>}
   */
  async deletePattern(pattern: string): Promise<void> {
    if (!this.redis || !this.isConnected) {
      return;
    }
    try {
      let cursor = '0';
      do {
        // Retrieve keys in batches of 100 to minimize latency impact on Redis
        const [nextCursor, keys] = await this.redis.scan(
          cursor,
          'MATCH',
          pattern,
          'COUNT',
          100,
        );
        cursor = nextCursor;
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } while (cursor !== '0');
      this.logger.log(`Invalidated cache keys matching pattern "${pattern}"`);
    } catch (err) {
      this.logger.error(
        `Error scanning/deleting pattern "${pattern}" from Redis`,
        err,
      );
    }
  }

  /**
   * Closes the active Redis client connection during NestJS module destruction.
   * @returns {Promise<void>}
   */
  async onModuleDestroy() {
    if (this.redis) {
      this.logger.log('Disconnecting from Redis...');
      await this.redis.quit();
    }
  }
}
