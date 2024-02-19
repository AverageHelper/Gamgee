import type { Infer } from "superstruct";
import { boolean, is, number, record, string, type } from "superstruct";
import { isUrlString } from "./guards.js";
import { useLogger } from "../logger.js";

const languagesMetadata = record(string(), number());

type LanguagesMetadata = Infer<typeof languagesMetadata>;

const repoMetadata = type({
	name: string(),
	full_name: string(),
	private: boolean(),
	html_url: string(),
	description: string(),
	languages_url: string()
});

type RepoMetadata = Infer<typeof repoMetadata>;

export interface GitForgeMetadata extends RepoMetadata {
	languages: Record<string, number>;
}

export interface Options {
	owner: string;
	repo: string;
}

const logger = useLogger();

/**
 * Fetches metadata about the provided git repository.
 */
export async function gitForgeMetadata(options: Readonly<Options>): Promise<GitForgeMetadata> {
	const { owner, repo } = options;
	const forgeApi = new URL("https://api.github.com/");
	const url = new URL(`/repos/${owner}/${repo}`, forgeApi);

	logger.verbose(`Asking ${url.href} about its metadata...`);
	const repoData = await getFrom(url, isRepoMetadata);
	const languagesUrl = new URL(repoData.languages_url);

	logger.verbose(`Asking ${languagesUrl.href} about language statistics...`);
	const languages = await getFrom(languagesUrl, isLanguagesMetadata);

	return { ...repoData, languages };
}

export class UnexpectedResponseError extends TypeError {
	constructor(url: URL) {
		super(`[${url.href}] Server response was unexpected`);
		this.name = "UnexpectedResponseError";
	}
}

function isRepoMetadata(tbd: unknown): tbd is RepoMetadata {
	return (
		is(tbd, repoMetadata) && //
		isUrlString(tbd.html_url) &&
		isUrlString(tbd.languages_url)
	);
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
