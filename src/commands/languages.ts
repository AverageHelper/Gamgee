import type { Command } from "./Command";
import gitHubMetadata from "github-metadata";
import type { GitHubMetadata } from "github-metadata";
import richErrorMessage from "../helpers/richErrorMessage";

let cachedMetadata: GitHubMetadata | null | "waiting" = null;

const languages: Command = {
  name: "languages",
  description: "Print my core repository's language statistics.",
  async execute({ message, logger }) {
    const owner = "AverageHelper";
    const repo = "Gamgee";
    const exclude: Array<string> = [];

    if (cachedMetadata === "waiting") {
      await message.channel.send("Working on it...");
      return;
    }
    void message.channel.startTyping();

    if (cachedMetadata === null) {
      try {
        cachedMetadata = "waiting";
        await message.channel.send("Let me think...");

        // eslint-disable-next-line require-atomic-updates
        cachedMetadata = await gitHubMetadata({ owner, repo, exclude });
      } catch (error: unknown) {
        logger.error(richErrorMessage("Failed to get metadata from my GitHub repo.", error));
        await message.channel.send("Erm... I'm not sure :sweat_smile:");
        message.channel.stopTyping(true);
        return;
      }
    }

    const languages = cachedMetadata.languages;
    if (languages === undefined) {
      await message.channel.send("I'm really not sure. Ask my boss that.");
      message.channel.stopTyping(true);
      return;
    }

    const totalLanguages = Object.keys(languages).length;
    if (totalLanguages > 3) {
      // Lots of languages. Be vague.
      await message.channel.send(
        `I'm made up of about ${totalLanguages} different languages, each one of them perfect and unique.`
      );
      message.channel.stopTyping(true);
      return;
    }

    let totalUse = 0;
    Object.values(languages).forEach(val => {
      totalUse += val ?? 0;
    });

    const stats = Object.entries(languages).map(([languageName, languageUse]) => {
      const use = (languageUse ?? 0) / totalUse;
      return `${(use * 100).toFixed(2)}% ${languageName}`;
    });

    logger.debug(`Gamgee is made of ${totalLanguages} languages:\n${stats.join("\n")}`);

    const last = stats.splice(-1)[0] ?? "a secret language only I know the meaning of";
    if (totalLanguages > 2) {
      await message.channel.send(`I'm made of ${stats.join(", ")}, and ${last}.`);
    } else if (totalLanguages > 1) {
      await message.channel.send(`I'm made of ${stats.join(", ")} and ${last}. :blush:`);
    } else {
      await message.channel.send(`I'm made of ${last}. :blush:`);
    }

    message.channel.stopTyping(true);
  }
};

export default languages;
