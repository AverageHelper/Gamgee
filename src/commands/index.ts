import type { Command } from "./Command.js";
import { isNotNull } from "../helpers/guards.js";

export * from "./Command.js";

import { cooldown } from "./cooldown.js";
import { help } from "./help.js";
import { howto } from "./howto.js";
import { languages } from "./languages.js";
import { limits } from "./limits.js";
import { nowPlaying } from "./nowPlaying.js";
import { ping } from "./ping.js";
import { quo } from "./queue/index.js";
import { setPrefix } from "./setPrefix.js";
import { sr } from "./songRequest.js";
import { stats } from "./stats.js";
import { test } from "./test.js";
import { t } from "./type.js";
import { userinfo } from "./userinfo.js";
import { version } from "./version.js";
import { video } from "./video.js";

const _allCommands = new Map<string, Command>();
export const allCommands: ReadonlyMap<string, Command> = _allCommands;

function aliasesForCommand(cmd: Pick<Command, "aliases">): Array<string> {
	return cmd.aliases?.slice() ?? [];
}

function localizationsForCommand(cmd: Pick<Command, "nameLocalizations">): Array<string> {
	return Array.from(
		new Set(
			Object.values(cmd.nameLocalizations ?? {}).filter(isNotNull), //
		),
	);
}

/**
 * Finds the name of the command referenced by the given alias.
 *
 * Returns the provided `alias` if no match is found. The caller
 * should check that the result is an actual command name.
 */
export function resolveAlias(
	alias: string,
	commands: ReadonlyMap<string, Pick<Command, "aliases" | "nameLocalizations">> = allCommands,
): string {
	for (const [name, command] of commands) {
		// If found, use the command's primary name
		const aliases = aliasesForCommand(command);
		if (aliases.includes(alias)) return name;

		const localizations = localizationsForCommand(command);
		if (localizations.includes(alias)) return name;
	}
	// Return the alias name if we couldn't resolve it
	return alias;
}

function add(command: Command): void {
	const name = command.name;
	const aliases = aliasesForCommand(command);
	const localizations = localizationsForCommand(command);

	// Ensure name uniqueness
	if (allCommands.has(name)) {
		throw new TypeError(
			`Failed to add command '${name}' when a command with that name was already added`,
		); // TODO: i18n?
	}

	// Ensure alias uniqueness
	for (const alias of aliases) {
		if (allCommands.has(alias)) {
			throw new TypeError(
				`Failed to add command with alias '${alias}' when a command with that name (by the name of '${command.name}') was already added`,
			); // TODO: i18n?
		}
		for (const command of allCommands.values()) {
			if (command.aliases?.includes(alias) === true) {
				throw new TypeError(
					`Failed to add command with alias '${alias}' when a command with that alias (by the name of '${command.name}') was already added`,
				); // TODO: i18n?
			}
		}
	}

	// Ensure localization uniqueness
	for (const localization of localizations) {
		if (allCommands.has(localization)) {
			throw new TypeError(
				`Failed to add command with localized name '${localization}' when a command with that name (by the name of '${command.name}') was already added`,
			); // TODO: i18n?
		}
		for (const command of allCommands.values()) {
			const otherLocalizations = localizationsForCommand(command);
			if (otherLocalizations.includes(localization)) {
				throw new TypeError(
					`Failed to add command with localized name '${localization}' when a command with that localization (by the name of '${command.name}') was already added`,
				); // TODO: i18n?
			}
		}
	}

	// Note the command by its name
	_allCommands.set(name, command);
}

add(cooldown);
add(help);
add(howto);
add(languages);
add(limits);
add(nowPlaying);
add(ping);
add(quo);
add(setPrefix);
add(sr);
add(stats);
add(test);
add(t);
add(userinfo);
add(version);
add(video);
