import { onEvent } from "../helpers/onEvent.js";
import { richErrorMessage } from "../helpers/richErrorMessage.js";

/**
 * The event handler for Discord Client errors
 */
export const error = onEvent("error", {
	once: false,
	execute(error, logger) {
		logger.error(richErrorMessage("Received client error.", error));
	}
});
