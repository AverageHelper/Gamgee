import { SECONDS_IN_MINUTE } from "../constants/time";
import { useLogger } from "../logger";
import crossFetch from "cross-fetch"; // Move this to a dynamic import once Node 18 hits LTS

const logger = useLogger();

// A shim to fall back on `cross-fetch` when built-in `fetch` is unavailable.
export const fetch: typeof globalThis.fetch = async (input, init) => {
	if ("fetch" in globalThis) {
		logger.debug("Using built-in `fetch`");
		return await globalThis.fetch(input, init);
	}

	logger.debug("Using `cross-fetch`");
	return await crossFetch(input, init);
};

/**
 * Runs a `fetch` request using the given request. The request is aborted
 * after the given `timeoutSeconds` have elapsed.
 *
 * @param timeoutSeconds The number of seconds to wait before attempting to
 * abort the request. The default value is `50`.
 */
export async function fetchWithTimeout(
	input: Parameters<typeof globalThis.fetch>[0],
	timeoutSeconds: number = 50,
	init: Omit<Parameters<typeof globalThis.fetch>[1], "signal"> = {}
): ReturnType<typeof globalThis.fetch> {
	// Abort the request after the given timeout
	const timeoutController = new AbortController();
	setTimeout(() => timeoutController.abort(), timeoutSeconds * SECONDS_IN_MINUTE);
	const signal = timeoutController.signal;

	return await fetch(input, { ...init, signal });
}
