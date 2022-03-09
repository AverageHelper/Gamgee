// More info on JSON-LD (Linked Data):
// https://moz.com/blog/json-ld-for-beginners

import type { Fields } from "./metadataFields.js";
import type { CheerioAPI, Element } from "cheerio";

export default function extractJsonLd($: CheerioAPI): Partial<Fields> {
	const $scriptTags = $("script");
	let extracted: Partial<Fields> = {};

	try {
		$scriptTags.each(function each(this: Element) {
			const type = $(this).attr("type") ?? "";
			if (type && type === "application/ld+json") {
				const text = $(this).contents().text();
				extracted = JSON.parse(text) as Partial<Fields>;
			}
		});
	} catch {}

	return extracted;
}
