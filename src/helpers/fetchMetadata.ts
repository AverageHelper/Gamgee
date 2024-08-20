import type { Result } from "htmlmetaparser";
import { Handler } from "htmlmetaparser";
import { Parser } from "htmlparser2";

/**
 * Retrieves metadata about the webpage at the given `url`.
 */
export async function fetchMetadata(url: URL, signal?: AbortSignal): Promise<Result> {
	const result = await fetch(url, { signal });
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
			{ url: url.href },
		);

		const parser = new Parser(handler);
		parser.write(html);
		parser.end();
	});
}
