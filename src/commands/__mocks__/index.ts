import Discord from "discord.js";

interface MockCommand {
	name: string;
	execute: jest.Mock;
}

export { invokeCommand } from "../../actions/invokeCommand";

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
