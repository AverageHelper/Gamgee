import Discord from "discord.js";

interface MockCommand {
	name: string;
	execute: jest.Mock;
}

export { invokeCommand } from "../../actions/invokeCommand.js";

/* eslint-disable @typescript-eslint/consistent-type-imports */
const { resolveAlias, allCommands: realAllCommands } = jest.requireActual<
	typeof import("../index.js")
>("../index.js");
/* eslint-enable @typescript-eslint/consistent-type-imports */

export { resolveAlias };

export const allCommands = new Discord.Collection<string, MockCommand>();

function addMock(commandName: string): void {
	allCommands.set(commandName, {
		name: commandName,
		execute: jest.fn().mockResolvedValue(undefined)
	});
}

// Add all commands to our mock commands list
realAllCommands.forEach((_, key) => addMock(key));
