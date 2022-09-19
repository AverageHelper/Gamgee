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
