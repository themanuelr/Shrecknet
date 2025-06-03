// Define roles in order of increasing privilege
export const ROLES = ["player", "writer", "world builder", "system admin"] as const;
export type UserRole = typeof ROLES[number];

// Return true if userRole has at least the privilege of requiredRole
export function hasRole(userRole: UserRole | undefined, requiredRole: UserRole): boolean {
  if (!userRole) return false;
  return ROLES.indexOf(userRole) >= ROLES.indexOf(requiredRole);
}