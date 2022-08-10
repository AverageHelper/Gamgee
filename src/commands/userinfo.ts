import type { Command } from "./Command.js";

export const userinfo: Command = {
	name: "userinfo",
	nameLocalizations: {
		de: "benutzerinfo",
		"en-GB": "userinfo",
		"en-US": "userinfo",
		"es-ES": "usuarioinfo",
		fr: "utilinfo",
		hu: "felhasználóiadatok",
		"pt-BR": "usuárioinfo"
	},
	description: "Returns some information about you.",
	descriptionLocalizations: {
		de: "Gibt einige Informationen über Sie zurück.",
		"en-GB": "Returns some information about you.",
		"en-US": "Returns some information about you.",
		"es-ES": "Devuelve alguna información sobre usted.",
		fr: "Retourne quelques informations sur vous.",
		hu: "Néhány információt visszaad rólad.",
		"pt-BR": "Retorna algumas informações sobre você."
	},
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
