import type { Result } from "htmlmetaparser";
import type { URL } from "node:url";
import { fetch } from "./fetch.js";
import { Handler } from "htmlmetaparser";
import { Parser } from "htmlparser2";

/**
 * Retrieves metadata about the webpage at the given `url`.
 */
export async function fetchMetadata(url: URL): Promise<Result> {
	const result = await fetch(url);
	const html = await result.text();

	return await new Promise((resolve, reject) => {
		const handler = new Handler(
			(error, result) => {
				if (error) {
					reject(error);
				} else {
					resolve(result);
				}
			},
			{ url: url.href }
		);

		const parser = new Parser(handler);
		parser.write(html);
		parser.end();
	});
}
