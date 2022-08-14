/* Adapted from https://github.com/laurengarcia/url-metadata */

import type { Fields } from "./lib/metadataFields.js";
import type { URL } from "node:url";
import fetch from "cross-fetch";
import parse from "./lib/parse.js";

type RequestInit = Exclude<Parameters<typeof fetch>[1], undefined>;

export interface Options {
	userAgent?: string;
	fromEmail?: string;
	maxRedirects?: number;
	timeout?: number;
	descriptionLength?: number;
	ensureSecureImageRequest?: boolean;
	sourceMap?: Record<string, string>;
	decode?: (arg: string) => string;
	encode?: (arg: unknown) => string;
}

export type Metadata = Partial<Fields>;

function timeoutSignal(timeout: number): AbortSignal {
	const controller = new AbortController();

	setTimeout(() => controller.abort(), timeout);

	return controller.signal;
}

export default async function urlMetadata(url: URL, options?: Options): Promise<Metadata> {
	const opts = {
		userAgent: "MetadataScraper",
		fromEmail: "example@example.com",
		maxRedirects: 10,
		timeout: 10000,
		descriptionLength: 750,
		ensureSecureImageRequest: true,
		sourceMap: {},
		decode: undefined,
		encode: undefined,
		...options
	};

	const requestOpts: RequestInit = {
		headers: {
			"User-Agent": opts.userAgent,
			From: opts.fromEmail
		},
		redirect: "follow",
		// follow: opts.maxRedirects, // FIXME: How to set max redirects?
		signal: timeoutSignal(opts.timeout)
	};
	const response = await fetch(url.href, requestOpts);

	if (response.status && response.status !== 200) {
		throw new Error(`response code ${response.status}`);
	}
	if (response.status && response.status === 200) {
		// rewrite url if our request had to follow redirects to resolve the
		// final link destination (for example: links shortened by bit.ly)
		let body: string = await response.text();
		if (opts.decode) {
			body = opts.decode(body);
		}
		return parse(response.url || url.href, body, opts);
	}

	return {};
}
