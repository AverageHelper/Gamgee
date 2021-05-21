/**
 * Adds a prefix and postfix to a string.
 *
 * @param straightText The text without pre/postfix.
 * @param prefix Characters to add before the text.
 * @param postfix Characters to add after the text. Defaults to the value of `prefix`.
 *
 * @returns The given text, with added pre- and postfix.
 */
export function addCharactersAround(
  straightText: string,
  prefix: string,
  postfix?: string
): string {
  if (!straightText) return straightText;
  if (straightText.startsWith(prefix) && straightText.endsWith(postfix ?? prefix))
    return straightText;
  return `${prefix}${straightText}${postfix ?? prefix}`;
}
