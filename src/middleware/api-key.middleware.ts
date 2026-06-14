import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class ApiKeyMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const cleanPath = (req.originalUrl || req.path || '')
      .split('?')[0]
      .replace(/\/$/, '');

    // Exempt paths: health, public assets, SSE stream, auth, metrics, swagger
    if (
      cleanPath === '/health' ||
      cleanPath.startsWith('/public') ||
      cleanPath.startsWith('/products/live-changes') ||
      cleanPath.startsWith('/auth') ||
      cleanPath === '/metrics' ||
      cleanPath.startsWith('/api')
    ) {
      return next();
    }

    // Check API key first
    const apiKey = req.header('x-api-key');
    if (apiKey && apiKey === process.env.API_KEY) {
      return next();
    }

    // Check JWT Bearer token as fallback
    const authHeader = req.header('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const payload = this.jwtService.verify(token, {
          secret: process.env.JWT_SECRET || 'supersecretjwtkey999',
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (req as any).user = payload;
        return next();
      } catch {
        throw new UnauthorizedException('Invalid or expired JWT token');
      }
    }

    throw new UnauthorizedException('Invalid or missing API key or JWT token');
  }
}

