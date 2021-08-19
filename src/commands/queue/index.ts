import type { Command, Subcommand } from "../Command";
import { invokeCommand } from "../../actions/invokeCommand";
import { resolveSubcommandNameFromOption } from "../../helpers/optionResolvers";
import Discord from "discord.js";
import StringBuilder from "../../helpers/StringBuilder";
import setup from "./setup";
import teardown from "./teardown";
import blacklist from "./blacklist";
import whitelist from "./whitelist";
import open from "./open";
import close from "./close";
import limit from "./limit";
import stats from "./stats";
import restart from "./restart";

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

const sr: Command = {
	name: "quo",
	description: "Administrative commands to manage the song queue.",
	options: namedSubcommands,
	requiresGuild: true,
	permissions: ["owner", "admin", "queue-admin"],
	async execute(context) {
		const firstOption = context.options.data[0];
		if (!firstOption) {
			const response = new StringBuilder("The possible subcommands are:");
			Object.values(namedSubcommands).forEach(command => {
				response.pushNewLine();
				response.push(" - ");
				response.pushCode(command.name);
			});

			return context.reply(response.result());
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
				context.options = new Discord.CommandInteractionOptionResolver(context.client, argOptions);
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

		const response = new StringBuilder("The possible subcommands are:");
		Object.values(namedSubcommands).forEach(command => {
			response.pushNewLine();
			response.push(" - ");
			response.pushCode(command.name);
		});
		return context.reply(response.result());
	}
};

export default sr;
