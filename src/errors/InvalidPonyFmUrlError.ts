import type { URL } from "url";
import { VideoError } from "./VideoError.js";

export class InvalidPonyFmUrlError extends VideoError {
	readonly code = "422";

	constructor(url: URL) {
		super(`This URL isn't a valid Pony.fm song URL: ${url.toString()}`);
		this.name = "InvalidPonyFmUrlError";
	}
}
