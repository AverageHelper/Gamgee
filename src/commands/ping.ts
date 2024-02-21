import type { Command } from "./Command.js";
import type { Message } from "discord.js";
import { code } from "../helpers/composeStrings.js";
import { localizations, ti } from "../i18n.js";
import { randomPhrase, unwrappingFirstWith } from "../helpers/randomStrings.js";

export const ping: Command = {
	name: "ping",
	nameLocalizations: localizations("commands.ping.name"),
	description: "Ping my host server to check latency.",
	descriptionLocalizations: localizations("commands.ping.description"),
	requiresGuild: false,
	async execute(context) {
		const { client, user, logger, guildLocale, type } = context;
		const random = unwrappingFirstWith(
			{
				me: client.user.username,
				otherUser: user,
				otherMember: null,
			},
			randomPhrase(),
		);

		let testMessage: Message;
		let responseTime: number;

		// FIXME: Ping seems to report slower for messages vs interactions. This is probably to do with the extra API work we do around message parsing. Best fix that
		if (type === "message") {
			testMessage = await context.message.reply({
				content: random,
				allowedMentions: { repliedUser: false },
			});
			responseTime = testMessage.createdTimestamp - context.message.createdTimestamp;
		} else {
			await context.interaction.reply({
				content: random,
				allowedMentions: { repliedUser: false },
			});
			testMessage = await context.interaction.fetchReply();
			responseTime = testMessage.createdTimestamp - context.interaction.createdTimestamp;
		}

		const apiLatency = Math.round(client.ws.ping);
		await testMessage.edit({
			content: ti(
				"commands.ping.responses.pong",
				{ time: code(`${responseTime}ms`), latency: code(`${apiLatency}ms`) },
				guildLocale,
			),
			allowedMentions: { repliedUser: false },
		});
		logger.info(`Sent ping response in ${responseTime}ms. API latency is ${apiLatency}ms.`);
	},
};
