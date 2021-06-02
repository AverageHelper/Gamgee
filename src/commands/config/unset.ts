import type { Subcommand } from "../Command";
import { SAFE_PRINT_LENGTH } from "../../constants/output";
import { listKeys } from "../../constants/config/keys";
import { isConfigKey, allKeys } from "../../constants/config";
import { getConfigValue } from "../../actions/config/getConfigValue";
import { setConfigValue } from "../../actions/config/setConfigValue";
import { isNonEmptyArray } from "../../helpers/guards";
import { resolveStringFromOption } from "../../helpers/optionResolvers";

const unset: Subcommand = {
	name: "unset",
	description: "Reset the value of a configuration setting to default.",
	options: [
		{
			name: "key",
			description: "The config key to unset",
			type: "STRING",
			required: true,
			choices: allKeys.map(key => ({
				name: key,
				value: key
			}))
		}
	],
	type: "SUB_COMMAND",
	requiresGuild: false,
	async execute({ options, storage, reply }) {
		if (!isNonEmptyArray(options)) {
			return reply(listKeys());
		}
		const key: string = resolveStringFromOption(options[0]);

		if (isConfigKey(key)) {
			await setConfigValue(storage, key, undefined);
			const value = await getConfigValue(storage, key);
			return reply(`**${key}** reset to ${JSON.stringify(value)}`);
		}

		const that = key.length <= SAFE_PRINT_LENGTH ? `'${key}'` : "that";
		return reply(`I'm not sure what ${that} is. Try one of ${listKeys()}`);
	}
};

export default unset;
