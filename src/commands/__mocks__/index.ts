import Discord from "discord.js";

interface MockCommand {
	name: string;
	execute: jest.Mock;
}

export { invokeCommand } from "../../actions/invokeCommand.js";

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion, @typescript-eslint/consistent-type-imports
const { resolveAlias } = jest.requireActual("../index.js") as typeof import("../index.js");
export { resolveAlias };

export const allCommands = new Discord.Collection<string, MockCommand>();

function add(commandName: string): void {
	allCommands.set(commandName, {
		name: commandName,
		execute: jest.fn().mockResolvedValue(undefined)
	});
}

add("config");
add("help");
add("howto");
add("languages");
add("limits");
add("now-playing");
add("ping");
add("test");
add("quo");
add("sr");
add("t");
add("version");
add("video");
