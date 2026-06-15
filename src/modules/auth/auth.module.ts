/**
 * @file auth.module.ts
 * @description Authentication module configuring Passport-JWT, register/login endpoints,
 * and exporting AuthService, JwtStrategy, and configuration contexts for application-wide authentication.
 * @module AuthModule
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    // Initialize passport framework to default to JWT strategy validation
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // Configure JWT service options (using symmetric secret signing key and 1-day expiration)
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'supersecretjwtkey999',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService, JwtStrategy, PassportModule, JwtModule],
})
export class AuthModule {}
