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
	requiresGuild: false,
	async execute({ options, storage, reply }) {
		const keyOption = options.first();
		const valueOption = options.array()[1];
		if (!keyOption || !valueOption) {
			return reply(listKeys());
		}
		const key: string = resolveStringFromOption(keyOption);

		if (!isConfigKey(key)) {
			const that = key.length <= SAFE_PRINT_LENGTH ? `'${key}'` : "that";
			return reply(`I'm not sure what ${that} is. Try one of ${listKeys()}`);
		}

		const value = resolveStringFromOption(valueOption);
		if (value === undefined || value === "") {
			return reply("Expected a value to set.");
		}
		if (!isConfigValue(value)) {
			return reply("Invalid value type.");
		}
		await setConfigValue(storage, key, value);
		return reply(`**${key}**: ${JSON.stringify(value)}`);
	}
};

export default set;
