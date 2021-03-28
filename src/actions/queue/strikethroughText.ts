/**
 * Adds Markdown strikethrough markers to the string.
 *
 * @param straightText The text without strikethrough.
 * @returns The given text, with strikethrough.
 */
export function addStrikethrough(straightText: string): string {
  if (!straightText) return straightText;
  if (straightText.startsWith("~~") && straightText.endsWith("~~")) return straightText;
  return `~~${straightText}~~`;
}

/**
 * Removes Markdown strikethrough markers from the string.
 *
 * @param strickenText The text with strikethrough.
 * @returns The given text, sans strikethrough.
 */
export function removeStrikethrough(strickenText: string): string {
  if (!strickenText) return strickenText;
  if (!strickenText.startsWith("~~") || !strickenText.endsWith("~~")) {
    return strickenText;
  }
  return strickenText.slice(2, -2);
}
