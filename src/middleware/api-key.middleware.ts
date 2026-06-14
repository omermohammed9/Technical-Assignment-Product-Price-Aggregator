import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class ApiKeyMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const cleanPath = (req.originalUrl || req.path || '')
      .split('?')[0]
      .replace(/\/$/, '');

    if (
      cleanPath === '/health' ||
      cleanPath.startsWith('/public') ||
      cleanPath.startsWith('/products/live-changes')
    ) {
      return next();
    }

    const apiKey = req.header('x-api-key');

    if (!apiKey || apiKey !== process.env.API_KEY) {
      throw new UnauthorizedException('Invalid or missing API key');
    }

    next();
  }
}
