import type { GuildedCommand, Subcommand } from "../Command.js";
import { blacklist } from "./blacklist.js";
import { close } from "./close.js";
import { composed, createPartialString, push, pushNewLine } from "../../helpers/composeStrings.js";
import { getCommandPrefix } from "../../useGuildStorage.js";
import { invokeCommand } from "../../actions/invokeCommand.js";
import { limit } from "./limit.js";
import { localizations, t } from "../../i18n.js";
import { mentionSubcommand } from "../../helpers/mentionCommands.js";
import { open } from "./open.js";
import { resolveSubcommandNameFromOption } from "../../helpers/optionResolvers.js";
import { restart } from "./restart.js";
import { setup } from "./setup.js";
import { stats } from "./stats.js";
import { teardown } from "./teardown.js";
import { whitelist } from "./whitelist.js";

const namedSubcommands: NonEmptyArray<Subcommand> = [
	setup,
	teardown,
	blacklist,
	whitelist,
	open,
	close,
	limit,
	stats,
	restart,
];

export const quo: GuildedCommand = {
	name: "quo",
	nameLocalizations: localizations("commands.queue-admin.name"),
	description: "Administrative commands to manage the song queue.",
	descriptionLocalizations: localizations("commands.queue-admin.description"),
	options: namedSubcommands,
	requiresGuild: true,
	permissions: ["owner", "admin", "queue-admin"],
	async execute(context) {
		const locale = context.guildLocale;
		const firstOption = context.options[0];
		if (!firstOption) {
			const COMMAND_PREFIX = await getCommandPrefix(context.guild);
			const response = createPartialString(
				t("commands.queue-admin.responses.list-possible-subcommands", locale),
			);
			for (const command of namedSubcommands) {
				pushNewLine(response);
				push("- ", response);
				push(mentionSubcommand(quo, command, context.guild, COMMAND_PREFIX), response);
			}

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
				2,
			)}`,
		);
		for (const command of namedSubcommands) {
			if (command.name === arg) {
				const subcommandContext = {
					...context,
					options: argOptions.slice(),
				};
				context.logger.debug(
					`Handling subcommand '${command.name}' with options: ${JSON.stringify(
						context.options,
						undefined,
						2,
					)}`,
				);
				return await invokeCommand(command, subcommandContext);
			}
		}

		const COMMAND_PREFIX = await getCommandPrefix(context.guild);
		const response = createPartialString(
			t("commands.queue-admin.responses.list-possible-subcommands", locale),
		);
		for (const command of namedSubcommands) {
			pushNewLine(response);
			push("- ", response);
			push(mentionSubcommand(quo, command, context.guild, COMMAND_PREFIX), response);
		}
		return await context.reply(composed(response));
	},
};
