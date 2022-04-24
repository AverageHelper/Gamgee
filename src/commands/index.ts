import type { Command } from "./Command.js";
import Discord from "discord.js";

export * from "./Command.js";

import { config } from "./config/index.js";
import { cooldown } from "./cooldown.js";
import { help } from "./help.js";
import { howto } from "./howto.js";
import { languages } from "./languages.js";
import { limits } from "./limits.js";
import { nowPlaying } from "./nowPlaying.js";
import { ping } from "./ping.js";
import { quo } from "./queue/index.js";
import { sr } from "./songRequest.js";
import { stats } from "./stats.js";
import { test } from "./test.js";
import { t } from "./type.js";
import { version } from "./version.js";
import { video } from "./video.js";

export const allCommands = new Discord.Collection<string, Command>();

/**
 * Finds the name of the command referenced by the given alias.
 *
 * Returns the provided `alias` if no match is found. The caller
 * should check that the result is an actual command name.
 */
export function resolveAlias(alias: string): string {
	for (const [name, command] of allCommands) {
		const aliases = command.aliases ?? [];
		if (aliases.includes(alias)) {
			return name;
		}
	}
	return alias;
}

function add(command: Command): void {
	if (allCommands.has(command.name)) {
		throw new TypeError(
			`Failed to add command ${command.name} when a command with that name was already added`
		);
	}
	// TODO: Check that command aliases are as unique as command names
	allCommands.set(command.name, command);
}

add(config);
add(cooldown);
add(help);
add(howto);
add(languages);
add(limits);
add(nowPlaying);
add(ping);
add(quo);
add(sr);
add(stats);
add(test);
add(t);
add(version);
add(video);
