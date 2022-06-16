import type { Command, Subcommand } from "../Command.js";
import { get } from "./get.js";
import { invokeCommand } from "../../actions/invokeCommand.js";
import { resolveSubcommandNameFromOption } from "../../helpers/optionResolvers.js";
import { set } from "./set.js";
import { unset } from "./unset.js";

const namedSubcommands: NonEmptyArray<Subcommand> = [get, set, unset];

const subargsList = namedSubcommands
	.map(c => c.name)
	.map(v => `\`${v}\``)
	.join(", ");

export const config: Command = {
	name: "config",
	description: "Read and modify config options.",
	options: namedSubcommands,
	defaultMemberPermissions: ["ADMINISTRATOR"],
	requiresGuild: true,
	async execute(context) {
		const { options, reply } = context;

		const firstOption = options[0];
		if (!firstOption) {
			return await reply(`Missing command structure. Expected ${subargsList}`);
		}
		const arg: string = resolveSubcommandNameFromOption(firstOption);
		const argOptions = firstOption.options ?? [];

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
				const subcommandContext = {
					...context,
					options: argOptions.slice()
				};
				context.logger.debug(
					`Handling subcommand '${command.name}' with options: ${JSON.stringify(
						context.options,
						undefined,
						2
					)}`
				);
				return await invokeCommand(command, subcommandContext);
			}
		}

		return await reply(`I don't know what to do with that. I expected one of ${subargsList}`);
	}
};
