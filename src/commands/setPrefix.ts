import type { Command } from "./Command.js";
import { ApplicationCommandOptionType } from "discord.js";
import { localizations, t, ti } from "../i18n.js";
import { resolveStringFromOption } from "../helpers/optionResolvers.js";
import { setCommandPrefix } from "../useGuildStorage.js";

export const setPrefix: Command = {
	name: "setprefix",
	nameLocalizations: localizations("commands.setprefix.name"),
	aliases: ["set-prefix"],
	description: "Set the prefix used by message commands.",
	descriptionLocalizations: localizations("commands.setprefix.description"),
	options: [
		{
			name: "prefix",
			nameLocalizations: localizations("commands.setprefix.options.prefix.name"),
			description: "The new prefix to use before message commands.",
			descriptionLocalizations: localizations("commands.setprefix.options.prefix.description"),
			type: ApplicationCommandOptionType.String,
			minLength: 1,
			maxLength: 3,
			required: true,
		},
	],
	permissions: ["owner"],
	requiresGuild: true,
	async execute({ type, options, guild, guildLocale, userLocale, reply }) {
		// We call `reply` with `ephemeral: true`, which has different behavior between
		// slash-command interactions and message commands.
		const locale = type === "interaction" ? userLocale : guildLocale;

		const valueOption = options[0]; // TODO: Encorce the number of options at the type level
		if (!valueOption) {
			return await reply({
				content: t("commands.setprefix.responses.missing-value", locale),
				ephemeral: true,
			});
		}
		const newPrefix: string = resolveStringFromOption(valueOption);
		if (newPrefix === undefined || newPrefix === "") {
			return await reply({
				content: t("commands.setprefix.responses.missing-value", locale),
				ephemeral: true,
			});
		}

		// Actually set the darn thing
		await setCommandPrefix(guild, newPrefix);

		const { help } = await import("./help.js");
		const helpCommandName: string = help.nameLocalizations
			? help.nameLocalizations[locale] ?? help.name
			: help.name;

		return await reply({
			content: `**${t("commands.setprefix.responses.value-header", locale)}**: ${JSON.stringify(
				newPrefix,
			)}\n\n${ti(
				"commands.setprefix.responses.try-example",
				{ sample: `\`${newPrefix}${helpCommandName}\`` }, // We don't mention `/help` directly here because this command deals specifically with legacy commands
				locale,
			)}`,
			ephemeral: true,
		});
	},
};
