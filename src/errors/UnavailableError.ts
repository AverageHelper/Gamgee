import type { URL } from "url";
import { VideoError } from "./VideoError.js";

export class UnavailableError extends VideoError {
	readonly code = "410";

	constructor(url: URL) {
		super(`The video at this URL is not available: ${url.toString()}`);
		this.name = "UnavailableError";
	}
}
