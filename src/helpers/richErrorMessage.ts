import { composed, createPartialString, push, pushNewLine } from "./composeStrings.js";
import { isError } from "./isError.js";

export function richErrorMessage(preamble: string, error: unknown): string {
	const messageBuilder = createPartialString(preamble);
	pushNewLine(messageBuilder);

	if (isError(error)) {
		if (error instanceof AggregateError) {
			// Describe sub-errors
			push(`${error.name}: ${error.message}`, messageBuilder);
			for (const [index, err] of error.errors.entries()) {
				pushNewLine(messageBuilder);
				push(`${index + 1}: `, messageBuilder);
				if (isError(err)) {
					// Describe the error and its code
					if (err.code !== undefined) {
						push(` (${err.code})`, messageBuilder);
					}
					if (err.stack !== undefined) {
						push(err.stack, messageBuilder);
					}
				} else {
					// Describe the value thrown
					push(`${typeof err}: `, messageBuilder);
					push(JSON.stringify(err, undefined, 2), messageBuilder);
				}
			}
		} else {
			// Describe the error and its code
			if (error.code !== undefined) {
				push(` (${error.code})`, messageBuilder);
			}
			if (error.stack !== undefined) {
				push(error.stack, messageBuilder);
			}
		}
	} else {
		// Describe the value thrown
		push(`Error ${typeof error}: `, messageBuilder);
		push(JSON.stringify(error, undefined, 2), messageBuilder);
	}

	return composed(messageBuilder);
}
