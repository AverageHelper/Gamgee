/**
 * Adds Markdown strikethrough markers to the string.
 *
 * @param straightText The text without strikethrough.
 * @returns The given text, with strikethrough.
 */
export function addStrikethrough(straightText: string): string {
  if (!straightText) return straightText;
  if (
    straightText.substring(0, 2) === "~~" &&
    straightText.substring(straightText.length - 2) === "~~"
  )
    return straightText;
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
  if (
    strickenText.substring(0, 2) !== "~~" ||
    strickenText.substring(strickenText.length - 2) !== "~~"
  ) {
    return strickenText;
  }
  return strickenText.substring(2, strickenText.length - 2);
}
