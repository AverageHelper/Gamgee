import type { Command } from "../Command.js";
import { getCommandPrefix } from "../../useGuildStorage.js";
import { SLASH_COMMAND_INTENT_PREFIX } from "../../constants/database.js";

export const config: Command = {
	name: "config",
	description: "Read and modify config options.",
	deprecated: true,
	permissions: ["owner"],
	requiresGuild: true,
	async execute({ type, guild, userLocale, deleteInvocation, replyPrivately }) {
		await deleteInvocation();

		const { setPrefix } = await import("../setPrefix.js");
		const setPrefixCommandName: string = setPrefix.nameLocalizations
			? setPrefix.nameLocalizations[userLocale] ?? setPrefix.name
			: setPrefix.name;

		const messageCommandPrefix = await getCommandPrefix(guild);
		const commandPrefix =
			type === "interaction" ? SLASH_COMMAND_INTENT_PREFIX : messageCommandPrefix;

		await replyPrivately(
			`This command is obsolete. If you were looking to change my message command prefix for your server (currently \`${messageCommandPrefix}\`), try \`${commandPrefix}${setPrefixCommandName}\``
		);
	}
};
