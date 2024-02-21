import type { GuildedSubcommand } from "../Command.js";
import { ApplicationCommandOptionType } from "discord.js";
import { getQueueChannel } from "../../actions/queue/getQueueChannel.js";
import { isQueueOpen, setQueueOpen } from "../../useGuildStorage.js";
import { localizations, t } from "../../i18n.js";

export const open: GuildedSubcommand = {
	name: "open",
	nameLocalizations: localizations("commands.queue-admin.options.open.name"),
	description: "Start accepting song requests to the queue.",
	descriptionLocalizations: localizations("commands.queue-admin.options.open.description"),
	type: ApplicationCommandOptionType.Subcommand,
	requiresGuild: true,
	permissions: ["owner", "queue-admin"],
	async execute({
		guild,
		channel,
		type,
		createdTimestamp,
		logger,
		guildLocale,
		userLocale,
		reply,
		followUp,
		deleteInvocation,
	}) {
		logger.debug(`Got queue-open request at ${createdTimestamp}`);

		const [queueChannel] = await Promise.all([
			getQueueChannel(guild), //
			deleteInvocation(),
		]);

		if (!queueChannel) {
			return await reply({
				content: t("commands.queue-admin.options.open.responses.no-queue", userLocale),
				ephemeral: true,
			});
		}
		const isAlreadyOpen = await isQueueOpen(guild);
		if (isAlreadyOpen) {
			const message = t("commands.queue-admin.options.open.responses.already-open", userLocale);
			return await reply({
				content: `${message} :smiley:`,
				ephemeral: true,
			});
		}

		await setQueueOpen(true, guild);
		logger.debug(`Opened queue at ${Date.now()}`);

		const queueIsCurrent = channel?.id === queueChannel.id;
		await queueChannel.send(
			`${t(
				"commands.queue-admin.options.open.responses.this-queue-now-open",
				guildLocale,
			)} :smiley:`,
		);
		if (!queueIsCurrent) {
			if (type === "interaction") {
				await reply({
					content: t("commands.queue-admin.options.open.responses.ack", userLocale),
					ephemeral: true,
				});
			}
			await followUp({
				content: `${t(
					"commands.queue-admin.options.open.responses.the-queue-now-open",
					guildLocale,
				)} :smiley:`,
				reply: false,
			});
		}
	},
};
