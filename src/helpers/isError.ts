/**
 * Asserts that a value is a NodeJS error.
 *
 * @param toBeDetermined The value to check.
 * @returns a boolean value indicating whether the provided value is an `Error`.
 */
export function isError(toBeDetermined: unknown): toBeDetermined is NodeJS.ErrnoException {
	return toBeDetermined instanceof Error;
}

export default isError;
