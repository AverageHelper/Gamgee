import type { URL } from "url";
import { VideoError } from "./VideoError.js";

export class InvalidYouTubeUrlError extends VideoError {
	readonly code = "422";

	constructor(url: URL) {
		super(`This URL isn't a valid YouTube video URL: ${url.toString()}`);
		this.name = "InvalidYouTubeUrlError";
	}
}
