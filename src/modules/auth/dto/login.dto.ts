/**
 * @file login.dto.ts
 * @description Data Transfer Object defining parameters for user login.
 * Validates request payload structure using class-validator decorators.
 * @module LoginDto
 */

import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  /** The unique email address used to identify the user */
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  /** The plain-text password for credential matching */
  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
