/**
 * @file jwt-auth.guard.ts
 * @description NestJS guard wrapping Passport-JWT strategy authentication.
 * Intercepts incoming requests to verify if a valid Bearer JWT is attached.
 * @module JwtAuthGuard
 */

import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
