import type { Message } from "discord.js";
import { handleCommand } from "../handleCommand.js";
import { MessageType } from "discord.js";
import { onEvent } from "../helpers/onEvent.js";
import { richErrorMessage } from "../helpers/richErrorMessage.js";

export const messageCreate = onEvent("messageCreate", {
	async execute(msg, logger) {
		// Fetch the message if it's partial
		const message: Message = msg.partial ? await msg.fetch() : msg;

		// Ignore if the message is from ourself
		const client = message.client;
		if (message.author.id === client.user.id) return;

		// Ignore if the message isn't a plain message
		const allowedMsgTypes: ReadonlyArray<MessageType> = [MessageType.Default, MessageType.Reply];
		if (!allowedMsgTypes.includes(message.type)) {
			const allowed = allowedMsgTypes.join(", ");
			logger.debug(`Skipping message of unknown type ${message.type} (allowed: [${allowed}])`);
			return;
		}

		// Handle the interaction
		try {
			await handleCommand(message, logger);
		} catch (error) {
			const msgDescription = JSON.stringify(message, undefined, 2);
			logger.error(richErrorMessage(`Failed to handle message: ${msgDescription}`, error));
		}
	},
});
