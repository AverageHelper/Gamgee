/** The guild owner role. */
export const ROLE_CATEGORY_OWNER = "ROLE_CATEGORY_OWNER";

/** The guild admin role. */
export const ROLE_CATEGORY_GUILD_ADMIN = "ROLE_CATEGORY_GUILD_ADMIN";

/** The guild's queue admin role. */
export const ROLE_CATEGORY_QUEUE_ADMIN = "ROLE_CATEGORY_QUEUE_ADMIN";

export type RoleCategory =
  | typeof ROLE_CATEGORY_OWNER
  | typeof ROLE_CATEGORY_GUILD_ADMIN
  | typeof ROLE_CATEGORY_QUEUE_ADMIN;
