import type { Subcommand } from "../Command.js";
import { SAFE_PRINT_LENGTH } from "../../constants/output.js";
import { listKeys } from "../../constants/config/keys.js";
import { isConfigKey, allKeys } from "../../constants/config/index.js";
import { getConfigValue } from "../../actions/config/getConfigValue.js";
import { resolveStringFromOption } from "../../helpers/optionResolvers.js";

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
	requiresGuild: true,
	async execute({ options, storage, reply }) {
		const firstOption = options.data[0];
		if (!firstOption) {
			return reply({ content: listKeys(), ephemeral: true });
		}
		const key: string = resolveStringFromOption(firstOption);

		if (isConfigKey(key)) {
			const value = await getConfigValue(storage, key);
			return reply({ content: `**${key}**: ${JSON.stringify(value)}`, ephemeral: true });
		}

		const that = key.length <= SAFE_PRINT_LENGTH ? `'${key}'` : "that";
		return reply({
			content: `I'm not sure what ${that} is. Try one of ${listKeys()}`,
			ephemeral: true
		});
	}
};

export default get;
