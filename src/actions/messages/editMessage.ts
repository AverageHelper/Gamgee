import Discord from "discord.js";
import richErrorMessage from "../../helpers/richErrorMessage.js";
import { useLogger } from "../../logger.js";

const logger = useLogger();

/**
 * Attempts to edit the given Discord message. If Discord throws an
 * error at the edit attempt, then the error will be logged and the
 * function's resulting `Promise` will resolve to `false`.
 *
 * @param message The message to delete.
 * @param options The parts of the message to edit.
 *
 * @returns a `Promise` that resolves to `true` if the message was edited successfully.
 */
export async function editMessage(
	message: Discord.Message | Discord.PartialMessage,
	options: string | Discord.MessageEditOptions | Discord.MessagePayload
): Promise<boolean> {
	try {
		await message.edit(options);
		return true;
	} catch (error: unknown) {
		logger.error(richErrorMessage("Failed to edit a message.", error));
		return false;
	}
}

/**
 * Enables or disables URI-related embeds from text messages.
 *
 * @param message The message to edit.
 * @param suppress Whether embeds are to be suppressed or permitted. Defaults to `true`.
 */
export async function suppressEmbedsForMessage(
	message: Discord.Message,
	suppress: boolean = true
): Promise<void> {
	try {
		if (!message.author.bot) {
			// Assume we didn't send this. Change flags only
			const flags = new Discord.MessageFlags(message.flags.bitfield);

			if (suppress) {
				flags.add(Discord.MessageFlags.FLAGS.SUPPRESS_EMBEDS);
				await message.edit({ flags, allowedMentions: { users: [] } }); // Suppress pings, too
			} else {
				flags.remove(Discord.MessageFlags.FLAGS.SUPPRESS_EMBEDS);
			}

			return;
		}

		// We sent this. We can edit it.
		if (suppress) {
			await editMessage(message, {
				content: escapeUriInString(message.content),
				allowedMentions: { users: [] }
			});
		} else {
			await editMessage(message, { content: stopEscapingUriInString(message.content) });
		}
	} catch (error: unknown) {
		logger.error(richErrorMessage("Cannot suppress message embeds.", error));
	}
}

export interface Range {
	start: number;
	end: number;
}

export function stopEscapingUriInString(content: string): string {
	const uris = positionsOfUriInText(content);
	if (!uris) return content;

	let freed = content.slice(0);

	uris.reverse().forEach(range => {
		// Remove tails
		if (freed[range.end] === ">") {
			freed = freed.slice(0, range.end) + freed.slice(range.end + 1);
		}

		// Remove heads
		if (freed[range.start - 1] === "<") {
			freed = freed.slice(0, range.start - 1) + freed.slice(range.start);
		}
	});

	return freed;
}

/**
 * Adds embed-blocking markers around URI substrings in a provided string.
 *
 * @param content The content to escape
 * @returns The content, with URI substrings marked.
 */
export function escapeUriInString(content: string): string {
	const uris = positionsOfUriInText(content);
	if (!uris) return content;

	let suppressed = content.slice(0);
	let delta = 0;

	uris.forEach(range => {
		// Add heads
		if (suppressed[range.start - 1 + delta] !== "<") {
			suppressed = `${suppressed.slice(0, range.start + delta)}<${suppressed.slice(
				range.start + delta
			)}`;
			delta += 1;
		}

		// Add tails
		if (suppressed[range.end + delta] !== ">") {
			suppressed = `${suppressed.slice(0, range.end + delta)}>${suppressed.slice(
				range.end + delta
			)}`;
			delta += 1;
		}
	});

	return suppressed;
}

export function positionsOfUriInText(str: string): NonEmptyArray<Range> | null {
	const uri = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/gu;

	let results: NonEmptyArray<Range> | null = null;
	let match: RegExpExecArray | null = null;

	while ((match = uri.exec(str))) {
		const range: Range = {
			start: match.index,
			end: match.index + (match[0]?.length ?? 0)
		};
		if (!results) {
			results = [range];
		} else {
			results.push(range);
		}
	}

	return results;
}
