import type { Subcommand } from "../Command.js";
import { ApplicationCommandOptionType } from "discord.js";
import { SAFE_PRINT_LENGTH } from "../../constants/output.js";
import { listKeys, allKeys } from "../../constants/config/keys.js";
import { isConfigKey, isConfigValue } from "../../constants/config/index.js";
import { resolveStringFromOption } from "../../helpers/optionResolvers.js";
import { setConfigValue } from "../../actions/config/setConfigValue.js";

export const set: Subcommand = {
	name: "set",
	description: "Set the value of a configuration setting.",
	options: [
		{
			name: "key",
			description: "A config key",
			type: ApplicationCommandOptionType.String,
			required: true,
			choices: allKeys.map(key => ({
				name: key,
				value: key
			}))
		},
		{
			name: "value",
			description: "The new value to set for the config key.",
			type: ApplicationCommandOptionType.String,
			required: true
		}
	],
	type: ApplicationCommandOptionType.Subcommand,
	requiresGuild: true,
	async execute({ options, storage, reply }) {
		const keyOption = options[0];
		const valueOption = options[1];
		if (!keyOption || !valueOption) {
			return await reply({ content: listKeys(), ephemeral: true });
		}
		const key: string = resolveStringFromOption(keyOption);

		if (!isConfigKey(key)) {
			const that = key.length <= SAFE_PRINT_LENGTH ? `'${key}'` : "that";
			return await reply({
				content: `I'm not sure what ${that} is. Try one of ${listKeys()}`,
				ephemeral: true
			});
		}

		const value = resolveStringFromOption(valueOption);
		if (value === undefined || value === "") {
			return await reply({ content: "Expected a value to set.", ephemeral: true });
		}
		if (!isConfigValue(value)) {
			return await reply({ content: "Invalid value type.", ephemeral: true });
		}
		await setConfigValue(storage, key, value);
		return await reply({ content: `**${key}**: ${JSON.stringify(value)}`, ephemeral: true });
	}
};
