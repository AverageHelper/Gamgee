import type { Options } from "../index.js";
import { truncate, cleanTitleString, ensureSecureImageRequest } from "./utils.js";

export default function clean(key: string, value: string, options: Options): string {
	if (key === "description" || key === "og:description") {
		value = truncate(value, options.descriptionLength);
	}
	if (key === "og:title" || key === "title") {
		value = cleanTitleString(value);
	}
	if (key === "image" || key === "og:image:secure_url" || key === "og:image") {
		if (options.ensureSecureImageRequest === true) value = ensureSecureImageRequest(value);
	}

	return value;
}
