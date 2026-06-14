import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly redis: Redis | null = null;
  private isConnected = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    try {
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
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
    }
  }

  /**
   * Retrieves a value from Redis cache.
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
   * Sets a value in Redis cache with an optional TTL (in seconds).
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
   * Deletes a specific key.
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
   * Deletes keys matching a specific pattern safely using SCAN.
   */
  async deletePattern(pattern: string): Promise<void> {
    if (!this.redis || !this.isConnected) {
      return;
    }
    try {
      let cursor = '0';
      do {
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

  async onModuleDestroy() {
    if (this.redis) {
      this.logger.log('Disconnecting from Redis...');
      await this.redis.quit();
    }
  }
}
