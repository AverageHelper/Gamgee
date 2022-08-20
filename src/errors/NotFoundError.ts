import type { URL } from "node:url";
import { VideoError } from "./VideoError.js";

export class NotFoundError extends VideoError {
	readonly code = "404";

	constructor(url: URL) {
		super(`No video found at ${url.href}`); // TODO: i18n
		this.name = "NotFoundError";
	}
}
