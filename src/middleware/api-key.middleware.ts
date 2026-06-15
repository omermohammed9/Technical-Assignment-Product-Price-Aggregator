import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';

/**
 * @file api-key.middleware.ts
 * @description Authentication middleware implementing a hybrid validation model.
 * Validates incoming HTTP requests by checking for either a valid `x-api-key` header
 * or a valid JWT Bearer token in the `Authorization` header. Exempts public routes
 * (health, SSE feed, Swagger UI, static assets, login/register endpoints).
 * @module ApiKeyMiddleware
 */

@Injectable()
export class ApiKeyMiddleware implements NestMiddleware {
  /**
   * Creates an instance of ApiKeyMiddleware.
   * @param {JwtService} jwtService - Service used to verify Bearer JWT signatures
   */
  constructor(private readonly jwtService: JwtService) {}

  /**
   * Evaluates request credentials. Exempts paths or validates API Key / JWT.
   *
   * @param {Request} req - Express Request object
   * @param {Response} res - Express Response object
   * @param {NextFunction} next - Callback function to pass execution control to the next handler
   * @throws {UnauthorizedException} If credentials are missing, malformed, or expired
   */
  use(req: Request, res: Response, next: NextFunction) {
    // Clean trailing slashes and query parameters for robust route matching
    const cleanPath = (req.originalUrl || req.path || '')
      .split('?')[0]
      .replace(/\/$/, '');

    // Exempt paths: health ping, static assets, SSE real-time stream, authentication controllers, prometheus metrics, swagger ui
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

    // Step 1: Precedence Check - API Key validation (header: x-api-key)
    const apiKey = req.header('x-api-key');
    if (apiKey && apiKey === process.env.API_KEY) {
      return next();
    }

    // Step 2: Fallback Check - JWT Bearer Token validation (header: Authorization)
    const authHeader = req.header('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const payload = this.jwtService.verify(token, {
          secret: process.env.JWT_SECRET || 'supersecretjwtkey999',
        });
        // Attach decoded payload containing userId and roles to request object for downstream controllers/guards
        (req as any).user = payload;
        return next();
      } catch {
        throw new UnauthorizedException('Invalid or expired JWT token');
      }
    }

    // If both authorization attempts fail, deny access
    throw new UnauthorizedException('Invalid or missing API key or JWT token');
  }
}
