import type { CommandContext } from "../commands/index.js";
import type { Invocable } from "./assertUserCanRunCommand.js";
import { assertUserCanRunCommand } from "./assertUserCanRunCommand.js";
import { isGuildedCommandContext } from "../commands/CommandContext.js";
import { t } from "../i18n.js";
import { useLogger } from "../logger.js";

const logger = useLogger();

async function failPermissions(context: CommandContext): Promise<void> {
	return await context.replyPrivately({
		content: t("common.no-personal-permission", context.userLocale),
		ephemeral: true
	});
}

async function failNoGuild(context: CommandContext): Promise<void> {
	return await context.reply({
		content: t("common.not-here", context.userLocale),
		ephemeral: true
	});
}

/**
 * Runs the command if the invocation context satisfies the command's
 * declared guild and permission requirements.
 *
 * @param command The command to execute.
 * @param context The invocation context.
 */
export async function invokeCommand(command: Invocable, context: CommandContext): Promise<void> {
	if (!command.requiresGuild) {
		// No guild required
		logger.debug(`Command '${command.name}' does not require guild information.`);
		logger.debug("Proceeding...");
		return await command.execute(context);
	}

	if (!isGuildedCommandContext(context)) {
		// No guild found
		logger.debug(`Command '${command.name}' requires guild information, but none was found.`);
		return await failNoGuild(context);
	}

	if (await assertUserCanRunCommand(context.member, command, context.channel)) {
		return await command.execute(context);
	}
	return await failPermissions(context);
}
