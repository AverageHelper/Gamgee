import type { Command } from "./Command";
import Discord from "discord.js";

export * from "./Command";

import config from "./config";
import help from "./help";
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
allCommands.set(config.name, config);
allCommands.set(help.name, help);
allCommands.set(languages.name, languages);
allCommands.set(limits.name, limits);
allCommands.set(nowPlaying.name, nowPlaying);
allCommands.set(ping.name, ping);
allCommands.set(queue.name, queue);
allCommands.set(songRequest.name, songRequest);
allCommands.set(type.name, type);
allCommands.set(version.name, version);
allCommands.set(video.name, video);
