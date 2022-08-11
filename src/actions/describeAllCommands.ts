import type Discord from "discord.js";
import type { Command, CommandContext, Subcommand } from "../commands/index.js";
import type { PartialString } from "../helpers/composeStrings.js";
import { ApplicationCommandOptionType } from "discord.js";
import { assertUserCanRunCommand } from "./invokeCommand.js";
import { getConfigCommandPrefix } from "./config/getConfigValue.js";
import { isGuildedCommandContext } from "../commands/CommandContext.js";
import {
	createPartialString,
	composed,
	push,
	pushCode,
	pushNewLine
} from "../helpers/composeStrings.js";

// Standard punctuation that we'll only use here
const DASH = " - ";
const SEP = " | ";
const INDENT = "    ";
const CODE = "`";
const REQ_START = "<";
const REQ_END = ">";
const VAL_START = "[";
const VAL_END = "]";
const OPT = "?";

/**
 * Constructs a string that describes the available commands.
 *
 * @param context The context of the request. Determines which commands get printed.
 * @param commands The collection of available commands.
 * @returns a string describing all commands.
 */
export async function describeAllCommands(
	context: CommandContext,
	commands: Map<string, Command>
): Promise<string> {
	const COMMAND_PREFIX =
		context.type === "message" ? await getConfigCommandPrefix(context.storage) : "/";

	// Describe all commands
	const description = createPartialString();
	const allCommands = Array.from(commands.values());
	for (const command of allCommands) {
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
		push(CODE, cmdDesc);
		push(`${COMMAND_PREFIX}${command.name}`, cmdDesc);

		describeParameters(command.options ?? [], cmdDesc);

		push(CODE, cmdDesc);

		if (context.type === "message") {
			// Slash-commands have autocomplete, so aliases aren't as useful. We'll ignore them in the /help buzz
			const aliases = (command.aliases ?? []).filter(alias => alias !== command.name);
			if (aliases.length > 0) {
				aliases.forEach(alias => {
					push(" OR ", cmdDesc);
					pushCode(`${COMMAND_PREFIX}${alias}`, cmdDesc);
				});
			}
		}

		push(DASH, cmdDesc);
		push(command.description, cmdDesc);

		// Describe all subcommands
		command.options
			?.filter(optn => optn.type === ApplicationCommandOptionType.Subcommand)
			?.forEach(sub => {
				// Describe the subcommand
				const subDesc = createPartialString();
				pushNewLine(subDesc);
				push(INDENT, subDesc);

				push(CODE, subDesc);
				push(`${COMMAND_PREFIX}${command.name} ${sub.name}`, subDesc);

				if ("options" in sub) {
					describeParameters(sub.options ?? [], subDesc);
				}

				push(CODE, subDesc);

				push(DASH, subDesc);
				push(sub.description, subDesc);
				push(composed(subDesc), cmdDesc);
			});

		push(composed(cmdDesc), description);
		pushNewLine(description);
	}

	return composed(description);
}

function describeParameters(
	options: Array<
		| Discord.ApplicationCommandOption
		| Discord.ApplicationCommandOptionData
		| Discord.ApplicationCommandChoicesData
		| Discord.ApplicationCommandNonOptionsData
		| Subcommand
	>,
	cmdDesc: PartialString
): void {
	options
		?.filter(optn => optn.type !== ApplicationCommandOptionType.Subcommand)
		?.forEach(o => {
			const option = o as Discord.ApplicationCommandChoicesData;

			// Describe the parameter
			const subDesc = createPartialString();
			push(" ", subDesc);

			if (option.required === true && option.choices) {
				push(REQ_START, subDesc);
			} else {
				push(VAL_START, subDesc);
			}

			if (option.required === undefined || !option.required) {
				push(OPT, subDesc);
			}

			if (option.choices) {
				// specific value
				const choiceValues = option.choices.map(ch => `${ch.value}`);
				push(choiceValues.join(SEP) ?? "", subDesc);
			} else {
				// arbitrary value
				push(option.name, subDesc);
			}

			if (option.required === true && option.choices) {
				push(REQ_END, subDesc);
			} else {
				push(VAL_END, subDesc);
			}

			push(composed(subDesc), cmdDesc);
		});
}
