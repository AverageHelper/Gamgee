import isError from "./isError";
import { AggregateError } from "./any";
import StringBuilder from "./StringBuilder";

export default function richErrorMessage(preamble: string, error: unknown): string {
  const messageBuilder = new StringBuilder(preamble);
  messageBuilder.pushNewLine();

  if (isError(error)) {
    if (error instanceof AggregateError) {
      // Describe sub-errors
      messageBuilder.push(`${error.name}: ${error.message}`);
      error.errors.forEach((err, index) => {
        messageBuilder.pushNewLine();
        messageBuilder.push(`${index + 1}: `);
        if (isError(err)) {
          // Describe the error and its code
          if (err.code !== undefined) {
            messageBuilder.push(` (${err.code})`);
          }
          if (err.stack !== undefined) {
            messageBuilder.push(err.stack);
          }
        } else {
          // Describe the value thrown
          messageBuilder.push(`${typeof err}: `);
          messageBuilder.push(JSON.stringify(err, undefined, 2));
        }
      });
    } else {
      // Describe the error and its code
      if (error.code !== undefined) {
        messageBuilder.push(` (${error.code})`);
      }
      if (error.stack !== undefined) {
        messageBuilder.push(error.stack);
      }
    }
  } else {
    // Describe the value thrown
    messageBuilder.push(`Error ${typeof error}: `);
    messageBuilder.push(JSON.stringify(error, undefined, 2));
  }

  return messageBuilder.result();
}
