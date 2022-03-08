import type { CheerioAPI, Element } from "cheerio";
import type { Fields } from "./metadataFields.js";

export default function extractMetaTags($: CheerioAPI): Partial<Fields> {
	const $metaTags = $("meta");
	const extracted: Partial<Fields> = {};

	$metaTags.each(function each(this: Element) {
		if ($(this).attr("content") ?? "") {
			const name = $(this).attr("name") ?? "";
			if (name) {
				extracted[name as keyof Fields] = $(this).attr("content");
			}
			const property = $(this).attr("property") ?? "";
			if (property) {
				extracted[property as keyof Fields] = $(this).attr("content");
			}
			const itemprop = $(this).attr("itemprop") ?? "";
			if (itemprop) {
				extracted[itemprop as keyof Fields] = $(this).attr("content");
			}
		}
	});

	return extracted;
}
