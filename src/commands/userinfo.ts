import type { Command } from "./Command.js";
import { localizations } from "../i18n.js";

// TODO: i18n
export const userinfo: Command = {
	name: "userinfo",
	nameLocalizations: localizations("commands.userinfo.name"),
	description: "Returns some information about you.",
	descriptionLocalizations: localizations("commands.userinfo.description"),
	requiresGuild: false,
	async execute(context) {
		if (context.type !== "interaction") {
			await context.deleteInvocation();
			return await context.replyPrivately(`Try \`/${userinfo.name}\` instead!`);
		}
		const { interaction, replyPrivately } = context;

		const guildLocale = interaction.guildLocale;
		const locale = interaction.locale;

		// TODO: Create an embed with some user details
		if (guildLocale) {
			await replyPrivately(
				`[WIP] Your locale is \`${locale}\`, and your guild's locale is \`${guildLocale}\``
			);
		} else {
			await replyPrivately(`[WIP] Your locale is \`${locale}\``);
		}
	}
};
