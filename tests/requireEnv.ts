import EnvVariableNotFoundError from "./EnvVariableNotFoundError";

type EnvKey = "BOT_PREFIX" | "CORDE_BOT_ID" | "QUEUE_CHANNEL_ID";

/**
 * Fetches the value of an environment variable key. If that value is not found, an error is thrown.
 *
 * @param key The key to find in the process environment variables.
 *
 * @throws an `EnvVariableNotFoundError` if there is no value set for the variable.
 * @returns the value of the environment variable key.
 */
export default function requireEnv(key: EnvKey): string {
  const value = process.env[key];
  if (value === void 0) throw new EnvVariableNotFoundError(key);
  return value;
}
