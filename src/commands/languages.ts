import type { GlobalCommand } from "./Command";
import type { GitHubMetadata } from "github-metadata";
import gitHubMetadata from "github-metadata";
import richErrorMessage from "../helpers/richErrorMessage";

let cachedMetadata: GitHubMetadata | null | "waiting" = null;

const languages: GlobalCommand = {
	name: "languages",
	description: "Print my core repository's language statistics.",
	requiresGuild: false,
	async execute({ logger, prepareForLongRunningTasks, reply }) {
		const owner = "AverageHelper";
		const repo = "Gamgee";
		const exclude: Array<string> = [];

		if (cachedMetadata === "waiting") {
			return reply("working on it...");
		}

		if (cachedMetadata === null) {
			try {
				cachedMetadata = "waiting";
				await prepareForLongRunningTasks();

				// eslint-disable-next-line require-atomic-updates
				cachedMetadata = await gitHubMetadata({ owner, repo, exclude });
			} catch (error: unknown) {
				logger.error(richErrorMessage("Failed to get metadata from my GitHub repo.", error));
				return reply("Erm... I'm not sure :sweat_smile:");
			}
		}

		const languages = cachedMetadata.languages;
		if (languages === undefined) {
			return reply("I'm really not sure. Ask my boss that.");
		}

		const totalLanguages = Object.keys(languages).length;
		if (totalLanguages > 3) {
			// Lots of languages. Be vague.
			return reply(
				`I'm made up of about ${totalLanguages} different languages, each one of them perfect and unique.`
			);
		}

		let totalUse = 0;
		Object.values(languages).forEach(val => {
			totalUse += val ?? 0;
		});

		const stats = Object.entries(languages).map(([languageName, languageUse]) => {
			const use = (languageUse ?? 0) / totalUse;
			return `${(use * 100).toFixed(1)}% ${languageName}`;
		});

		logger.debug(`Gamgee is made of ${totalLanguages} languages:\n${stats.join("\n")}`);

		const last = stats.splice(-1)[0] ?? "a secret language only I know the meaning of";
		if (totalLanguages > 2) {
			return reply(`I'm made of ${stats.join(", ")}, and ${last}.`);
		} else if (totalLanguages > 1) {
			return reply(`I'm made of ${stats.join(", ")} and ${last}. :blush:`);
		}
		return reply(`I'm made of ${last}. :blush:`);
	}
};

export default languages;
