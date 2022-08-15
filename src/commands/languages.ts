import type { GitHubMetadata } from "../helpers/githubMetadata.js";
import type { GlobalCommand } from "./Command.js";
import { gitHubMetadata } from "../helpers/githubMetadata.js";
import { locales } from "../i18n.js";
import { richErrorMessage } from "../helpers/richErrorMessage.js";
import { timeoutSeconds } from "../helpers/timeoutSeconds.js";

let cachedMetadata: GitHubMetadata | null | "waiting" = null;

// TODO: i18n
export const languages: GlobalCommand = {
	name: "languages",
	description: "Print my core repository's language statistics.",
	requiresGuild: false,
	async execute({ logger, prepareForLongRunningTasks, reply, followUp }) {
		const owner = "AverageHelper";
		const repo = "Gamgee";

		if (cachedMetadata === "waiting") {
			return await reply("working on it...");
		}

		if (cachedMetadata === null) {
			try {
				cachedMetadata = "waiting";
				await prepareForLongRunningTasks();

				// eslint-disable-next-line require-atomic-updates
				cachedMetadata = await gitHubMetadata({ owner, repo });
			} catch (error) {
				logger.error(richErrorMessage("Failed to get metadata from my GitHub repo.", error));
				await reply("Erm... I'm not sure :sweat_smile:");
				await timeoutSeconds(1);
				await followUp({
					content: `I do know that I can speak ${locales.length} different human languages!`,
					reply: false
				});
				return;
			}
		}

		const languages = cachedMetadata.languages;
		logger.debug(`Language metadata: ${JSON.stringify(languages, null, "  ")}`);
		if (languages === undefined) {
			await reply("I'm really not sure. Ask my boss that.");
			await timeoutSeconds(1);
			await followUp({
				content: `I do know that I can speak ${locales.length} different human languages!`,
				reply: false
			});
			return;
		}

		const totalLanguages = Object.keys(languages).length;
		if (totalLanguages > 3) {
			// Lots of languages. Be vague.
			await reply(
				`I'm made up of about ${totalLanguages} different languages, each one of them perfect and unique ^^`
			);
			await timeoutSeconds(1);
			await followUp({
				content: `I can also speak ${locales.length} different human languages!`,
				reply: false
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
			reply: false
		});
	}
};
