import type { Command } from "../Command";
import { invokeCommand } from "../../actions/invokeCommand";
import { resolveSubcommandNameFromOption } from "../../helpers/optionResolvers";
import Discord from "discord.js";
import get from "./get";
import set from "./set";
import unset from "./unset";

const namedSubcommands = [get, set, unset];

const subargsList = namedSubcommands
	.map(c => c.name)
	.map(v => `\`${v}\``)
	.join(", ");

const config: Command = {
	name: "config",
	description: "Read and modify config options.",
	options: namedSubcommands,
	permissions: ["owner"],
	requiresGuild: true,
	async execute(context) {
		const { options, reply } = context;

		const firstOption = options.first();
		if (!firstOption) {
			return reply(`Missing command structure. Expected ${subargsList}`);
		}
		const arg: string = resolveSubcommandNameFromOption(firstOption);
		const argOptions = firstOption.options ?? new Discord.Collection();

		context.logger.debug(
			`Searching ${
				namedSubcommands.length
			} possible subcommands for one named '${arg}': ${JSON.stringify(
				namedSubcommands.map(c => c.name),
				undefined,
				2
			)}`
		);
		for (const command of namedSubcommands) {
			if (command.name === arg) {
				context.options = argOptions;
				context.logger.debug(
					`Handling subcommand '${command.name}' with options: ${JSON.stringify(
						context.options,
						undefined,
						2
					)}`
				);
				return invokeCommand(command, context);
			}
		}

		return reply(`I don't know what to do with that. I expected one of ${subargsList}`);
	}
};

export default config;
