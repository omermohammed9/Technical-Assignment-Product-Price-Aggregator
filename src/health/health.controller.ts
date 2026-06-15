/**
 * @file health.controller.ts
 * @description Controller exposing the application health check endpoint.
 * Performs database query pings to confirm the system's operational viability.
 * @module HealthController
 */

import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../modules/prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  /**
   * Creates an instance of HealthController.
   * @param {PrismaService} prisma - Database service client used to execute raw SQL ping commands
   */
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Verifies the API and database states.
   * Excluded from global API Key and JWT guard protections to permit infrastructure health checks.
   *
   * @returns {Promise<{ status: string, database: string, timestamp: string }>} Health indicators
   * @throws {ServiceUnavailableException} If the database query execution fails (indicating connection loss)
   */
  @Get()
  @ApiOperation({ summary: 'Check health status of the API and database' })
  async checkHealth() {
    try {
      // Ping the PostgreSQL database via a lightweight SELECT 1 query
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new ServiceUnavailableException({
        status: 'unhealthy',
        database: 'disconnected',
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
