import type { Subcommand } from "../Command.js";
import { ApplicationCommandOptionType } from "discord.js";
import { SAFE_PRINT_LENGTH } from "../../constants/output.js";
import { listKeys } from "../../constants/config/keys.js";
import { isConfigKey, allKeys } from "../../constants/config/index.js";
import { getConfigValue } from "../../actions/config/getConfigValue.js";
import { setConfigValue } from "../../actions/config/setConfigValue.js";
import { resolveStringFromOption } from "../../helpers/optionResolvers.js";

// TODO: i18n
export const unset: Subcommand = {
	name: "unset",
	description: "Reset the value of a configuration setting to default.",
	options: [
		{
			name: "key",
			description: "The config key to unset",
			type: ApplicationCommandOptionType.String,
			required: true,
			choices: allKeys.map(key => ({
				name: key,
				value: key
			}))
		}
	],
	type: ApplicationCommandOptionType.Subcommand,
	requiresGuild: true,
	async execute({ options, storage, reply }) {
		const firstOption = options[0];
		if (!firstOption) {
			return await reply({ content: listKeys(), ephemeral: true });
		}
		const key: string = resolveStringFromOption(firstOption);

		if (isConfigKey(key)) {
			await setConfigValue(storage, key, undefined);
			const value = await getConfigValue(storage, key);
			return await reply({
				content: `**${key}** reset to ${JSON.stringify(value)}`,
				ephemeral: true
			});
		}

		const that = key.length <= SAFE_PRINT_LENGTH ? `'${key}'` : "that";
		return await reply({
			content: `I'm not sure what ${that} is. Try one of ${listKeys()}`,
			ephemeral: true
		});
	}
};
