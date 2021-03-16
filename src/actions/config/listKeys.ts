import allKeys from "../../constants/config/allKeys";

/**
 * Returns a message body that lists appropriate command keys to the user.
 */
export default function listKeys(): string {
  const keyList = allKeys //
    .map(key => `  - \`${key}\``)
    .join("\n");
  return `Valid config keys are as follows:\n${keyList}`;
}
