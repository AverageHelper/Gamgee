import type { GitForgeMetadata } from "../helpers/gitForgeMetadata.js";
import type { GlobalCommand } from "./Command.js";
import { gitForgeMetadata } from "../helpers/gitForgeMetadata.js";
import { locales, localizations } from "../i18n.js";
import { richErrorMessage } from "../helpers/richErrorMessage.js";
import { timeoutSeconds } from "../helpers/timeoutSeconds.js";

const owner = "AverageHelper";
const repo = "Gamgee";

let cachedMetadata: GitForgeMetadata | null = null;

// TODO: i18n
export const languages: GlobalCommand = {
	name: "languages",
	nameLocalizations: localizations("commands.languages.name"),
	description: "Print my core repository's language statistics.",
	descriptionLocalizations: localizations("commands.languages.description"),
	requiresGuild: false,
	async execute({ logger, prepareForLongRunningTasks, reply, followUp }) {
		try {
			await prepareForLongRunningTasks();
			if (cachedMetadata === null) {
				// eslint-disable-next-line require-atomic-updates
				cachedMetadata = await gitForgeMetadata({ owner, repo });
			}
		} catch (error) {
			logger.error(richErrorMessage("Failed to get metadata from my git forge.", error));
			await reply("Erm... I'm not sure :sweat_smile:");
			await timeoutSeconds(1);
			await followUp({
				content: `I do know that I can speak ${locales.length} different human languages!`,
				reply: false,
			});
			return;
		}

		const languages = cachedMetadata.languages;
		logger.debug(`Language metadata: ${JSON.stringify(languages, null, "  ")}`);

		const totalLanguages = Object.keys(languages).length;
		if (totalLanguages > 3) {
			// Lots of languages. Be vague.
			await reply(
				`I'm made up of about ${totalLanguages} different languages, each one of them perfect and unique ^^`,
			);
			await timeoutSeconds(1);
			await followUp({
				content: `I can also speak ${locales.length} different human languages!`,
				reply: false,
			});
			return;
		}

		let totalUse = 0;
		Object.values(languages).forEach(val => {
			totalUse += val ?? 0;
		});

		const stats = Object.entries(languages).map(([languageName, languageUse]) => {
			const use = (languageUse ?? 0) / totalUse;
			return `${(use * 100).toFixed(1)}% ${languageName}`;
		});

		logger.debug(`Gamgee is made of ${totalLanguages} languages: ${stats.join(", ")}`);

		const last = stats.splice(-1)[0] ?? "a secret language only I know the meaning of";
		if (totalLanguages > 2) {
			await reply(`I'm made of ${stats.join(", ")}, and ${last}.`);
		} else if (totalLanguages > 1) {
			await reply(`I'm made of ${stats.join(", ")} and ${last}. :blush:`);
		} else {
			await reply(`I'm made of ${last}. :blush:`);
		}

		await timeoutSeconds(1);
		await followUp({
			content: `I can also speak ${locales.length} different human languages!`,
			reply: false,
		});
	},
};
