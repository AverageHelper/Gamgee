import type { Command } from "./Command.js";
import { DEFAULT_LOCALE, isSupportedLocale, localizations } from "../i18n.js";
import {
	composed,
	createPartialString,
	push,
	pushCode,
	pushSpace
} from "../helpers/composeStrings.js";

// TODO: i18n
export const userinfo: Command = {
	name: "userinfo",
	nameLocalizations: localizations("commands.userinfo.name"),
	description: "Returns some information about you.",
	descriptionLocalizations: localizations("commands.userinfo.description"),
	requiresGuild: false,
	async execute({ guildLocaleRaw, userLocaleRaw, deleteInvocation, replyPrivately }) {
		// TODO: Create an embed with some user details

		await deleteInvocation();

		const response = createPartialString("Your locale is ");
		pushCode(userLocaleRaw ?? "unknown", response);
		pushSpace(response);
		if (userLocaleRaw) {
			if (isSupportedLocale(userLocaleRaw)) {
				push("(supported)", response);
			} else {
				push(
					isSupportedLocale(userLocaleRaw) ? "(supported)" : `(not supported, so we'll go with `,
					response
				);
				pushCode(DEFAULT_LOCALE, response);
				push(")", response);
			}
		} else {
			push(`(so we'll assume `, response);
			pushCode(DEFAULT_LOCALE, response);
			push(")", response);
		}

		if (guildLocaleRaw) {
			push(", and the server's locale is ", response);
			pushCode(guildLocaleRaw, response);
		}

		await replyPrivately(composed(response));
	}
};
