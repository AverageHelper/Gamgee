import type { URL } from "node:url";
import { VideoError } from "./VideoError.js";

export class UnavailableError extends VideoError {
	readonly code = "410";

	constructor(url: URL) {
		super(`The video at this URL is not available: ${url.href}`); // TODO: i18n
		this.name = "UnavailableError";
	}
}
