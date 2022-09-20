import type { GuildMember, User } from "discord.js";
import { randomElementOfArray } from "./randomElementOfArray.js";
import { useLogger } from "../logger.js";
import {
	celebratoryEmoji,
	greetings,
	hugs,
	philosophy,
	phrases,
	questions
} from "../constants/textResponses.js";

const logger = useLogger();

export interface ResponseContext {
	/** The bot's display name. */
	me: string;

	/** The user who initiated this conversation, e.g. by pinging the bot. */
	otherUser: User;

	/** The guild member, if any, representing the user who initiated this conversation. */
	otherMember: GuildMember | null;
}

export type SingleResponse = string | ((context: ResponseContext) => string);
export type MultipleResponse = [SingleResponse, SingleResponse, ...Array<SingleResponse>];

export type Response = SingleResponse | MultipleResponse;

export type ResponseRepository = [Response, ...NonEmptyArray<Response>];

/** Gets the response as a string. */
export function unwrappingFirstWith(context: ResponseContext, response: Response): string {
	if (typeof response === "string") {
		return response;
	} else if (Array.isArray(response)) {
		return response
			.map(partial => {
				if (typeof partial === "string") return partial;
				return partial(context);
			})
			.join("\n");
	}
	return response(context);
}

/**
 * For each partial response, awaits a handler function.
 * There's a delay between calls (1000 ms by default).
 */
export async function unwrappingWith(
	context: ResponseContext,
	response: Response,
	handler: (response: string) => unknown | Promise<unknown>,
	pauseTime: number = 1000
): Promise<void> {
	if (typeof response === "string") {
		// It's just a string
		await handler(response);

		return;
	} else if (Array.isArray(response)) {
		// It's an array
		for (const resp of response) {
			if (typeof resp === "string") {
				await handler(resp);
			} else {
				await handler(resp(context));
			}
			if (response.length > 1) {
				// If more than one, wait a second between each
				await new Promise(resolve => setTimeout(resolve, pauseTime));
			}
		}

		return;
	}
	// It's a function
	await handler(response(context));
}

/* Greetings */

export function randomGreeting(): Response {
	return randomResponseFromArray("greetings", greetings);
}

/* Phrases */

export function randomPhrase(): Response {
	return randomResponseFromArray("phrases", phrases);
}

/* Philosophy */

export function randomPhilosophy(): Response {
	return randomResponseFromArray("philosophy", philosophy);
}

/* Questions */

export function randomQuestion(): Response {
	return randomResponseFromArray("questions", questions);
}

/* Celebration */

export function randomCelebration(): Response {
	return randomResponseFromArray("celebration", celebratoryEmoji);
}

/* Hugs */

export function randomHug(): Response {
	return randomResponseFromArray("hugs", hugs);
}

const lastResponses = new Map<string, Response>();

/**
 * Returns a random value from the provided `array`, making sure that the value
 * does not match the value previously given (if the array is longer than 1 item)
 *
 * @param key The key by which to differentiate this array from the next.
 * @param array The array from which to source a response.
 *
 * @returns A response from the array.
 */
function randomResponseFromArray(key: string, array: ResponseRepository): Response {
	logger.debug(`Getting random string from array '${key}' (length ${array.length})`);
	let result: Response = randomElementOfArray(array);
	const lastResult = lastResponses.get(key);
	while (result === lastResult) {
		result = randomElementOfArray(array);
	}
	lastResponses.set(key, result);
	return result;
}
