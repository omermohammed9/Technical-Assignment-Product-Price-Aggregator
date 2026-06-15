/**
 * @file roles.guard.ts
 * @description Authorization guard evaluating Role-Based Access Control (RBAC).
 * Compares roles assigned to the current user (attached to request object by passport/JWT middleware)
 * with the roles metadata required by the target controller class or route handler.
 * @module RolesGuard
 */

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  /**
   * Creates an instance of RolesGuard.
   * @param {Reflector} reflector - NestJS utility for querying route/class metadata
   */
  constructor(private reflector: Reflector) {}

  /**
   * Evaluates role permissions for the incoming request context.
   *
   * @param {ExecutionContext} context - NestJS execution context enclosing request details
   * @returns {boolean} True if the user role matches at least one of the required roles, false otherwise
   */
  canActivate(context: ExecutionContext): boolean {
    // Retrieve required roles metadata attached to handler function or containing class (e.g. Roles decorator)
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true; // No roles restrictions defined; permit request access
    }
    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      return false; // Deny access if user context is missing from request
    }
    // Verify user role matches at least one declared required role
    return requiredRoles.some((role) => user.role === role);
  }
}
