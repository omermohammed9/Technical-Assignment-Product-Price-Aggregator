/**
 * @file role.enum.ts
 * @description Enumeration of roles authorized to access protected resources.
 * @enum {string}
 */
export enum Role {
  /** Standard user access role, permitted to query catalogs and stream feeds */
  USER = 'USER',
  /** Administrator role, permitted to run mock price simulations and administrative endpoints */
  ADMIN = 'ADMIN',
}
