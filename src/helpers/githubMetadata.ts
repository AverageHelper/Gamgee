import { fetch } from "./fetch.js";
import { isBoolean, isNumber, isObject, isString, isUrlString } from "./guards.js";
import { URL } from "node:url";
import { useLogger } from "../logger.js";

type RequestInit = Exclude<Parameters<typeof fetch>[1], undefined>;

export interface GitHubMetadata {
	name: string;
	full_name: string;
	private: boolean;
	html_url: string;
	description: string;
	languages_url: string;
	languages: Record<string, number>;
}

export interface Options {
	owner: string;
	repo: string;
}

const logger = useLogger();

/**
 * Fetches metadata about the provided GitHub repository.
 */
export async function gitHubMetadata(options: Options): Promise<GitHubMetadata> {
	const { owner, repo } = options;
	const gitHubApi = new URL("https://api.github.com/");
	const url = new URL(`/repos/${owner}/${repo}`, gitHubApi);

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

type RepoMetadata = Omit<GitHubMetadata, "languages">;

function isRepoMetadata(tbd: unknown): tbd is RepoMetadata {
	return (
		isObject(tbd) &&
		"name" in tbd &&
		"full_name" in tbd &&
		"private" in tbd &&
		"html_url" in tbd &&
		"description" in tbd &&
		"languages_url" in tbd &&
		isString((tbd as unknown as GitHubMetadata).name) &&
		isString((tbd as unknown as GitHubMetadata).full_name) &&
		isBoolean((tbd as unknown as GitHubMetadata).private) &&
		isUrlString((tbd as unknown as GitHubMetadata).html_url) &&
		isString((tbd as unknown as GitHubMetadata).description) &&
		isUrlString((tbd as unknown as GitHubMetadata).languages_url)
	);
}

function isLanguagesMetadata(tbd: unknown): tbd is Record<string, number> {
	return isObject(tbd) && Object.values(tbd).every(isNumber);
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
