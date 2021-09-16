import type { Subcommand } from "../Command";
import { SAFE_PRINT_LENGTH } from "../../constants/output";
import { listKeys, allKeys } from "../../constants/config/keys";
import { isConfigKey, isConfigValue } from "../../constants/config";
import { resolveStringFromOption } from "../../helpers/optionResolvers";
import { setConfigValue } from "../../actions/config/setConfigValue";

const set: Subcommand = {
	name: "set",
	description: "Set the value of a configuration setting.",
	options: [
		{
			name: "key",
			description: "A config key",
			type: "STRING",
			required: true,
			choices: allKeys.map(key => ({
				name: key,
				value: key
			}))
		},
		{
			name: "value",
			description: "The new value to set for the config key.",
			type: "STRING",
			required: true
		}
	],
	type: "SUB_COMMAND",
	requiresGuild: true,
	async execute({ options, storage, reply }) {
		const keyOption = options.data[0];
		const valueOption = options.data[1];
		if (!keyOption || !valueOption) {
			return reply({ content: listKeys(), ephemeral: true });
		}
		const key: string = resolveStringFromOption(keyOption);

		if (!isConfigKey(key)) {
			const that = key.length <= SAFE_PRINT_LENGTH ? `'${key}'` : "that";
			return reply({
				content: `I'm not sure what ${that} is. Try one of ${listKeys()}`,
				ephemeral: true
			});
		}

		const value = resolveStringFromOption(valueOption);
		if (value === undefined || value === "") {
			return reply({ content: "Expected a value to set.", ephemeral: true });
		}
		if (!isConfigValue(value)) {
			return reply({ content: "Invalid value type.", ephemeral: true });
		}
		await setConfigValue(storage, key, value);
		return reply({ content: `**${key}**: ${JSON.stringify(value)}`, ephemeral: true });
	}
};

export default set;
