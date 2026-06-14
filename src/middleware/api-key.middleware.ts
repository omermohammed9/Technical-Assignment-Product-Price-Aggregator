import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class ApiKeyMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Allow SSE and public static assets without an API key
    if (
      req.path === '/health' ||
      req.path.startsWith('/public') ||
      req.path.startsWith('/products/live-changes')
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
