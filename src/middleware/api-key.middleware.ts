// import {
//   Injectable,
//   NestMiddleware,
//   UnauthorizedException,
// } from '@nestjs/common';
// import { Request, Response, NextFunction } from 'express';
//
// @Injectable()
// export class ApiKeyMiddleware implements NestMiddleware {
//   use(req: Request, res: Response, next: NextFunction) {
//     console.log('🔍 API Key Middleware Executing:', req.path);
//     const apiKey = req.header('x-api-key');
//
//     if (
//       req.path.startsWith('/public') ||
//       req.path.startsWith('/products/live-changes')
//     ) {
//       console.log('✅ Skipping API Key for:', req.path);
//       return next(); // Allow without API Key
//     }
//
//     console.log('🔑 Received API Key:', apiKey);
//     if (apiKey !== process.env.API_KEY || apiKey !== supersecureapikey123) {
//       throw new UnauthorizedException('Invalid API Key');
//     }
//
//     next();
//   }
// }
