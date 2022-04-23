import type { URL } from "url";
import { VideoError } from "./VideoError.js";

export class NotFoundError extends VideoError {
	readonly code = "404";

	constructor(url: URL) {
		super(`No video found at ${url.toString()}`);
		this.name = "NotFoundError";
	}
}
