import { SECONDS_IN_MINUTE } from "../constants/time.js";

/**
 * Runs a `fetch` request using the given request. The request is aborted
 * after the given `timeoutSeconds` have elapsed.
 *
 * @param timeoutSeconds The number of seconds to wait before attempting to
 * abort the request. The default value is `50`.
 */
export async function fetchWithTimeout(
	input: string | URL | Request,
	timeoutSeconds: number = 50,
	init: Omit<RequestInit, "signal"> = {},
): Promise<Response> {
	// Abort the request after the given timeout
	const timeoutController = new AbortController();
	setTimeout(() => timeoutController.abort(), timeoutSeconds * SECONDS_IN_MINUTE);
	const signal = timeoutController.signal;

	return await fetch(input, { ...init, signal });
}
