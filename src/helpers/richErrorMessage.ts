import isError from "./isError";
import StringBuilder from "./StringBuilder";

export default function richErrorMessage(preamble: string, error: unknown): string {
  const messageBuilder = new StringBuilder(preamble);
  messageBuilder.pushNewLine();

  if (isError(error)) {
    messageBuilder.push(`${error.name}: ${error.message}`);
    if (error.code !== undefined) {
      messageBuilder.push(` (${error.code})`);
    }
    if (error.stack !== undefined) {
      messageBuilder.push(",\nStack: ");
      messageBuilder.push(error.stack);
    }
  } else {
    messageBuilder.push("Error: ");
    messageBuilder.push(JSON.stringify(error, undefined, 2));
  }

  return messageBuilder.result();
}
