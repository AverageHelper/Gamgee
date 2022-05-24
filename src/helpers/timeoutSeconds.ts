import { MILLISECONDS_IN_SECOND } from "../constants/time.js";

/**
 * Creates a `Promise` that resolves after the given number of seconds.
 */
export async function timeoutSeconds(seconds: number): Promise<void> {
	await new Promise(resolve => setTimeout(resolve, seconds * MILLISECONDS_IN_SECOND));
}
