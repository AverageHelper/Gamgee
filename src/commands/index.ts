import type { Command } from "./Command";
import Discord from "discord.js";

export * from "./Command";

import config from "./config";
import help from "./help";
import howto from "./howto";
import languages from "./languages";
import limits from "./limits";
import nowPlaying from "./nowPlaying";
import ping from "./ping";
import queue from "./queue";
import songRequest from "./songRequest";
import type from "./type";
import version from "./version";
import video from "./video";

export const allCommands = new Discord.Collection<string, Command>();

function add(command: Command): void {
	if (allCommands.has(command.name)) {
		throw new TypeError(
			`Failed to add command ${command.name} when a command with that name was already added`
		);
	}
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
add(type);
add(version);
add(video);
