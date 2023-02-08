import { SECONDS_IN_MINUTE } from "../constants/time";
import crossFetch from "cross-fetch"; // Move this to a dynamic import once we depend on Node 18

// TODO: only fall back on `cross-fetch` when built-in `fetch` is unavailable.
export const fetch = crossFetch;

/**
 * Runs a `fetch` request using the given request. The request is aborted
 * after the given `timeoutSeconds` have elapsed.
 *
 * @param timeoutSeconds The number of seconds to wait before attempting to
 * abort the request. The default value is `50`.
 */
export async function fetchWithTimeout(
	input: Parameters<typeof fetch>[0],
	timeoutSeconds: number = 50,
	init: Omit<Parameters<typeof fetch>[1], "signal"> = {}
): ReturnType<typeof fetch> {
	// Abort the request after the given timeout
	const timeoutController = new AbortController();
	setTimeout(() => timeoutController.abort(), timeoutSeconds * SECONDS_IN_MINUTE);
	const signal = timeoutController.signal;

	return await fetch(input, { ...init, signal });
}
