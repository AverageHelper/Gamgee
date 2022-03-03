import type { Command } from "./Command.js";
import Discord from "discord.js";

export * from "./Command.js";

import config from "./config/index.js";
import help from "./help.js";
import howto from "./howto.js";
import languages from "./languages.js";
import limits from "./limits.js";
import nowPlaying from "./nowPlaying.js";
import ping from "./ping.js";
import queue from "./queue/index.js";
import songRequest from "./songRequest.js";
import test from "./test.js";
import typeHere from "./type.js";
import version from "./version.js";
import video from "./video.js";

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
add(help);
add(howto);
add(languages);
add(limits);
add(nowPlaying);
add(ping);
add(queue);
add(songRequest);
add(test);
add(typeHere);
add(version);
add(video);
