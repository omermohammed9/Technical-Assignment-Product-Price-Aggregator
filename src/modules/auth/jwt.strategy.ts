/**
 * @file jwt.strategy.ts
 * @description Passport strategy configuration for validating JSON Web Tokens (JWT).
 * Extracts JWT Bearer tokens from authorization request headers, validates their signature,
 * and fetches the corresponding User database record to inject into NestJS request context.
 * @module JwtStrategy
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  /**
   * Creates an instance of JwtStrategy. Configures the token extraction strategy
   * (Extract from Authorization Header as Bearer token), expiration validation, and signature key.
   *
   * @param {PrismaService} prisma - Database client service used to resolve user records
   */
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'supersecretjwtkey999',
    });
  }

  /**
   * Hook executed by passport after a JWT is successfully decoded and verified.
   * Validates that the subject user exists in the database.
   *
   * @param {object} payload - Decoded JWT payload contents
   * @param {number} payload.id - Decoded user ID
   * @param {string} payload.email - Decoded user email address
   * @param {string} payload.role - Decoded user security role
   * @returns {Promise<any>} User database record attached to request context
   * @throws {UnauthorizedException} If the user does not exist in the database
   */
  async validate(payload: { id: number; email: string; role: string }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.id },
    });
    if (!user) {
      throw new UnauthorizedException('User not found or deactivated');
    }
    return user;
  }
}
