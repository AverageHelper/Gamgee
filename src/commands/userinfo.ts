import type { Command } from "./Command.js";
import { code } from "../helpers/composeStrings.js";
import { DEFAULT_LOCALE, isSupportedLocale, localizations, t, ti } from "../i18n.js";

export const userinfo: Command = {
	name: "userinfo",
	nameLocalizations: localizations("commands.userinfo.name"),
	description: "Returns some information about you.",
	descriptionLocalizations: localizations("commands.userinfo.description"),
	requiresGuild: false,
	async execute({ guildLocaleRaw, userLocaleRaw, userLocale, deleteInvocation, replyPrivately }) {
		// TODO: Create an embed with some user details

		await deleteInvocation();

		const ulocale = code(userLocaleRaw ?? t("commands.userinfo.responses.unknown", userLocale));
		const therefore = userLocaleRaw
			? isSupportedLocale(userLocaleRaw)
				? t("commands.userinfo.responses.supported", userLocale)
				: ti(
						"commands.userinfo.responses.unsupported",
						{ default: code(DEFAULT_LOCALE) },
						userLocale,
					)
			: ti("commands.userinfo.responses.assume", { default: code(DEFAULT_LOCALE) }, userLocale);

		let response: string;
		if (guildLocaleRaw) {
			const glocale = code(guildLocaleRaw);
			response = `${ti(
				"commands.userinfo.responses.statement",
				{ ulocale, therefore, glocale },
				userLocale,
			)}`;
		} else {
			response = `${ti(
				"commands.userinfo.responses.statement-sans-guild",
				{ ulocale, therefore },
				userLocale,
			)}`;
		}

		await replyPrivately(response);
	},
};
