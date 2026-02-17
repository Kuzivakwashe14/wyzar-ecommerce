/**
 * Utility for syncing Clerk publicMetadata.role to Prisma Role enum.
 *
 * Safety rule: if publicMetadata.role is absent, empty, or unrecognized,
 * the existing database role is preserved (no accidental demotion).
 */

const ROLE_MAP = {
  'admin': 'ADMIN',
  'seller': 'SELLER',
  'user': 'USER',
};

/**
 * Maps a Clerk publicMetadata.role string to a valid Prisma Role enum value.
 * Returns null if the metadata role is not a recognized value.
 */
function mapClerkRoleToPrismaRole(metadataRole) {
  if (!metadataRole || typeof metadataRole !== 'string') {
    return null;
  }
  return ROLE_MAP[metadataRole.trim().toLowerCase()] || null;
}

/**
 * Given a Clerk user object and the user's current DB role, determines
 * what the role update (if any) should be.
 *
 * Returns the new Prisma Role string if an update is needed,
 * or undefined if no change should be made.
 */
function resolveRoleFromClerkMetadata(clerkUser, currentDbRole = null) {
  const metadataRole = clerkUser?.publicMetadata?.role;
  const mappedRole = mapClerkRoleToPrismaRole(metadataRole);

  if (mappedRole === null) {
    return undefined; // No metadata role set — preserve existing DB role
  }

  if (currentDbRole && mappedRole === currentDbRole) {
    return undefined; // Already matches — no change needed
  }

  return mappedRole;
}

module.exports = { mapClerkRoleToPrismaRole, resolveRoleFromClerkMetadata };
