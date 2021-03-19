/**
 * A class which facilitates the construction of a complex string over time.
 */
export default class StringBuilder {
  private storage: Array<string> = [];

  /**
   *
   * @param initialString The initial state of the string builder.
   */
  constructor(initialString?: string) {
    if (initialString) {
      this.push(initialString);
    }
  }

  /**
   * Appends a string to the build result.
   *
   * @param str The string to append.
   */
  push(str: string): void {
    if (!str) return;
    this.storage.push(str);
  }

  /**
   * Appends a string with Markdown bold formatting.
   * @param str The string to embolden.
   */
  pushBold(str: string): void {
    this.push(`**${str}**`);
  }

  /**
   * Appends a newline character to the build result.
   *
   * Identical to calling `push("\n")`.
   */
  pushNewLine(): void {
    this.push("\n");
  }

  /**
   * Constructs a new string from the values previously added.
   * @returns The built string.
   */
  result(): string {
    return this.storage.join("");
  }

  /**
   * Resets the string builder's state to empty.
   */
  clear(): void {
    this.storage = [];
  }
}
