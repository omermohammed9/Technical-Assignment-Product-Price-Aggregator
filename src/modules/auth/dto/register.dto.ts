/**
 * @file register.dto.ts
 * @description Data Transfer Object defining parameters for user registration.
 * Validates request payload structure, length restrictions, and role enums using class-validator.
 * @module RegisterDto
 */

import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../enums/role.enum';

export class RegisterDto {
  /** The unique email address representing the new user identity */
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  /** The plain-text password, restricted to a minimum length of 6 characters */
  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  /** Optional security role (ADMIN or USER), defaulting to USER if unspecified */
  @ApiProperty({ enum: Role, default: Role.USER, required: false })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}
