/**
 * @file roles.decorator.ts
 * @description Custom metadata decorator used to assign role authorization constraints (e.g. ADMIN, USER)
 * on individual NestJS route handlers or controller classes. Evaluated by RolesGuard.
 * @module Roles
 */

import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

/** Key used in Reflector to store and extract required roles from route metadata */
export const ROLES_KEY = 'roles';

/**
 * Assigns required authorization roles to target routes.
 *
 * @param {...Role[]} roles - Security roles allowed to access the route
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
