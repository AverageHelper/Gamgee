import { isError } from "../helpers/isError.js";

export class VideoError extends Error {
	readonly code: string;

	constructor(error: unknown) {
		super("Unknown error");
		this.name = "VideoError";

		if (isError(error)) {
			this.message = error.message;
			this.code = error.code ?? "500";
			this.stack = error.stack;
		} else {
			this.message = JSON.stringify(error);
			this.code = "500";
		}
	}
}
