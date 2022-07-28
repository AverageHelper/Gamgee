import type { Command, Subcommand } from "../Command.js";
import { invokeCommand } from "../../actions/invokeCommand.js";
import { resolveSubcommandNameFromOption } from "../../helpers/optionResolvers.js";
import { setup } from "./setup.js";
import { teardown } from "./teardown.js";
import { blacklist } from "./blacklist.js";
import { whitelist } from "./whitelist.js";
import { open } from "./open.js";
import { close } from "./close.js";
import { limit } from "./limit.js";
import { stats } from "./stats.js";
import { restart } from "./restart.js";
import {
	composed,
	createPartialString,
	push,
	pushCode,
	pushNewLine
} from "../../helpers/composeStrings.js";

const namedSubcommands: NonEmptyArray<Subcommand> = [
	setup,
	teardown,
	blacklist,
	whitelist,
	open,
	close,
	limit,
	stats,
	restart
];

export const quo: Command = {
	name: "quo",
	description: "Administrative commands to manage the song queue.",
	options: namedSubcommands,
	requiresGuild: true,
	defaultMemberPermissions: ["ManageEvents"],
	async execute(context) {
		const firstOption = context.options[0];
		if (!firstOption) {
			const response = createPartialString("The possible subcommands are:");
			Object.values(namedSubcommands).forEach(command => {
				pushNewLine(response);
				push(" - ", response);
				pushCode(command.name, response);
			});

			return await context.reply(composed(response));
		}

		const arg: string = resolveSubcommandNameFromOption(firstOption);
		const argOptions = firstOption.options ?? [];
		context.logger.debug(`[queue] Our arg is '${arg ?? "undefined"}'`);

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

		const response = createPartialString("The possible subcommands are:");
		Object.values(namedSubcommands).forEach(command => {
			pushNewLine(response);
			push(" - ", response);
			pushCode(command.name, response);
		});
		return await context.reply(composed(response));
	}
};
