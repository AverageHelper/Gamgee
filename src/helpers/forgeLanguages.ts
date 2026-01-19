import type { Infer } from "superstruct";
import { is, number, record, string } from "superstruct";
import { useLogger } from "../logger.js";

const languagesMetadata = record(string(), number());

export type LanguagesMetadata = Infer<typeof languagesMetadata>;

export interface Options {
	owner: string;
	repo: string;
}

const logger = useLogger();

/**
 * Fetches metadata about the provided git repository's languages.
 */
export async function forgeLanguages(options: Readonly<Options>): Promise<LanguagesMetadata> {
	const { owner, repo } = options;
	const forgeApi = new URL("https://git.average.name/");
	const url = new URL(`/api/v1/repos/${owner}/${repo}/languages`, forgeApi);

	logger.verbose(`Asking ${url.href} about language statistics...`);
	return await getFrom(url, isLanguagesMetadata);
}

export class UnexpectedResponseError extends TypeError {
	constructor(url: URL) {
		super(`[${url.href}] Server response was unexpected`);
		this.name = "UnexpectedResponseError";
	}
}

function isLanguagesMetadata(tbd: unknown): tbd is LanguagesMetadata {
	return is(tbd, languagesMetadata);
}

/**
 * Performs a GET request at the provided URL, and checks that the
 * returned value is valid against a provided type guard.
 */
async function getFrom<T>(url: URL, typeGuard: TypeGuard<T>): Promise<T> {
	const request: RequestInit = { method: "GET" };
	try {
		const response = await fetch(url.href, request);

		const json: unknown = await response.json();

		if (!response.ok) throw json; // Expect that the response was an error
		if (!typeGuard(json)) throw new UnexpectedResponseError(url);

		return json;
	} catch (error) {
		// `fetch` only rejects on network failure.
		// See https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
		logger.error("Network Failure:", error);
		throw error;
	}
}
