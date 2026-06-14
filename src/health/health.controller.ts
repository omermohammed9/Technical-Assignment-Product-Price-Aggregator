import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../modules/prisma/prisma.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Check health status of the API and database' })
  async checkHealth() {
    try {
      // Ping the PostgreSQL database
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
