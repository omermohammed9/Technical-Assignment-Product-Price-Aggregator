/**
 * @file auth.controller.ts
 * @description Controller handling user authentication requests (registration and login).
 * Maps incoming HTTP POST requests to registration and login services and returns auth payloads/JWT tokens.
 * @module AuthController
 */

import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  /**
   * Creates an instance of AuthController.
   * @param {AuthService} authService - Service handling business logic for authentication
   */
  constructor(private readonly authService: AuthService) {}

  /**
   * Registers a new user.
   *
   * @param {RegisterDto} dto - Data Transfer Object containing registration details (email, password, role)
   * @returns {Promise<{ id: number, email: string, role: string }>} Details of the newly created user
   */
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * Logs in an existing user and issues a Bearer JWT access token.
   *
   * @param {LoginDto} dto - Data Transfer Object containing login credentials (email, password)
   * @returns {Promise<{ access_token: string }>} JWT signed token for request authorization
   */
  @Post('login')
  @ApiOperation({ summary: 'Log in a user to receive a JWT access token' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
