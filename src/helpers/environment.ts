import dotenv from "dotenv";
dotenv.config();

import EnvVariableNotFoundError from "./EnvVariableNotFoundError";

type EnvKey =
  | "NODE_ENV"
  | "DISCORD_TOKEN"
  | "DATABASE_FOLDER"
  | "BOT_PREFIX"
  | "BOT_TEST_ID"
  | "CORDE_TEST_TOKEN"
  | "CORDE_BOT_ID"
  | "CHANNEL_ID"
  | "QUEUE_CHANNEL_ID"
  | "GUILD_ID"
  | "QUEUE_ADMIN_ROLE_ID"
  | "EVENTS_ROLE_ID"
  | "BOT_ADMIN_ROLE_ID";

/**
 * Fetches the value of an environment variable key.
 *
 * @param key The key to find in the process environment variables.
 *
 * @returns the value of the environment variable key.
 */
export function getEnv(key: EnvKey): string | undefined {
  return process.env[key];
}

/**
 * Fetches the value of an environment variable key. If that value is not found, an error is thrown.
 *
 * @param key The key to find in the process environment variables.
 *
 * @throws an `EnvVariableNotFoundError` if there is no value set for the variable.
 * @returns the value of the environment variable key.
 */
export function requireEnv(key: EnvKey): string {
  const value = getEnv(key);
  if (value === void 0) throw new EnvVariableNotFoundError(key);
  return value;
}
