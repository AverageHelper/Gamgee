import type { Subcommand } from "../Command";
import { SAFE_PRINT_LENGTH } from "../../constants/output";
import { listKeys } from "../../constants/config/keys";
import { isConfigKey, allKeys } from "../../constants/config";
import { getConfigValue } from "../../actions/config/getConfigValue";
import { isNonEmptyArray } from "../../helpers/guards";
import { resolveStringFromOption } from "../../helpers/optionResolvers";

const get: Subcommand = {
	name: "get",
	description: "Get the value of a configuration setting.",
	options: [
		{
			name: "key",
			description: "The config key to get",
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
			const value = await getConfigValue(storage, key);
			return reply(`**${key}**: ${JSON.stringify(value)}`);
		}

		const that = key.length <= SAFE_PRINT_LENGTH ? `'${key}'` : "that";
		return reply(`I'm not sure what ${that} is. Try one of ${listKeys()}`);
	}
};

export default get;
