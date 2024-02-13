import type { ApplicationCommandOption } from "discord.js";
import type { Command, InteractionCommandContext, Subcommand } from "../commands/index.js";
import type { SupportedLocale } from "../i18n.js";
import { ApplicationCommandOptionType } from "discord.js";
import { assertUserCanRunCommand } from "./assertUserCanRunCommand.js";
import { createPartialString, composed, push, pushNewLine } from "../helpers/composeStrings.js";
import { getCommandPrefix } from "../useGuildStorage.js";
import { isGuildedCommandContext } from "../commands/CommandContext.js";
import { mentionCommand, mentionSubcommand } from "../helpers/mentionCommands.js";

// Standard punctuation that we'll only use here
const DASH = " - ";
const INDENT = "    ";

function localizedDescription(
	cmd: Pick<Command, "description" | "descriptionLocalizations">,
	locale: SupportedLocale
): string {
	const defaultDescription = cmd.description;
	if (cmd.descriptionLocalizations) {
		const localizedDescription = cmd.descriptionLocalizations[locale] ?? defaultDescription;
		return localizedDescription || defaultDescription;
	}
	return defaultDescription;
}

function isSubcommand(tbd: ApplicationCommandOption | Subcommand): tbd is Subcommand {
	return tbd.type === ApplicationCommandOptionType.Subcommand;
}

/**
 * Constructs a string that describes the available commands.
 *
 * @param context The context of the request. Determines which commands get printed.
 * @param commands The collection of available commands.
 * @returns a string describing all commands.
 */
export async function describeAllCommands(
	context: InteractionCommandContext,
	commands: ReadonlyMap<string, Command>,
	locale: SupportedLocale
): Promise<string> {
	// Describe all commands
	const description = createPartialString();
	const allCommands = Array.from(commands.values());
	for (const command of allCommands) {
		if (command.deprecated === true) continue; // Skip obsolete commands
		if (
			command.requiresGuild &&
			(!isGuildedCommandContext(context) ||
				!context.channel ||
				!(await assertUserCanRunCommand(context.member, command, context.channel)))
		) {
			continue; // User has no access, so move on
		}

		const cmdDesc = createPartialString();

		// Describe the command
		const COMMAND_PREFIX = await getCommandPrefix(context.guild);
		const commandDescription = localizedDescription(command, locale);

		if (command.requiresGuild) {
			push(mentionCommand(command, context.guild, COMMAND_PREFIX), cmdDesc);
		} else {
			push(mentionCommand(command, COMMAND_PREFIX), cmdDesc);
		}

		push(DASH, cmdDesc);
		push(commandDescription, cmdDesc);

		// Describe all subcommands
		const subcommands = command.options?.filter(isSubcommand) ?? [];
		for (const sub of subcommands) {
			const subDescription = localizedDescription(sub, locale);

			// Describe the subcommand
			const subDesc = createPartialString();
			pushNewLine(subDesc);
			push(INDENT, subDesc);

			if (command.requiresGuild) {
				push(mentionSubcommand(command, sub, context.guild, COMMAND_PREFIX), subDesc);
			}

			push(DASH, subDesc);
			push(subDescription, subDesc);
			push(composed(subDesc), cmdDesc);
		}

		push(composed(cmdDesc), description);
		pushNewLine(description);
	}

	return composed(description);
}
