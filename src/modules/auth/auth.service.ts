/**
 * @file auth.service.ts
 * @description Authentication service implementing user registration, secure password hashing using bcrypt,
 * credential validation during login, and JWT access token generation.
 * @module AuthService
 */

import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from './enums/role.enum';

@Injectable()
export class AuthService {
  /**
   * Creates an instance of AuthService.
   * @param {PrismaService} prisma - Database client service
   * @param {JwtService} jwtService - Service for creating JWT signed tokens
   */
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Registers a new user inside the database, hashing their password with bcrypt.
   * Checks for existing user email records first to prevent duplicates.
   *
   * @param {RegisterDto} dto - Registration data (email, password, optional role)
   * @returns {Promise<{ id: number, email: string, role: string }>} Basic created user details
   * @throws {ConflictException} If the email address is already taken
   */
  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // Hash raw password securely using 10 salt rounds before storing
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: (dto.role as any) ?? Role.USER,
      },
    });

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }

  /**
   * Validates user login credentials. Returns a JWT access token if valid.
   *
   * @param {LoginDto} dto - Credentials payload (email, password)
   * @returns {Promise<{ access_token: string }>} Signed JWT token payload
   * @throws {UnauthorizedException} If credentials do not match or user is not found
   */
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Compare input password with stored hash
    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Create payload and sign access token
    const payload = { id: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
