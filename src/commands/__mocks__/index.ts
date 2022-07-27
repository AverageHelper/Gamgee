import type { Command } from "../Command.js";

interface MockCommand {
	name: string;
	aliases?: Array<string>;
	execute: jest.Mock;
}

export { invokeCommand } from "../../actions/invokeCommand.js";

const { allCommands: realAllCommands } =
	jest.requireActual<typeof import("../index.js")>("../index");

export const allCommands = new Map<string, MockCommand>();

export function resolveAlias(alias: string): string {
	for (const [name, command] of allCommands) {
		const aliases = command.aliases ?? [];
		if (aliases.includes(alias)) {
			return name;
		}
	}
	return alias;
}

function addMock(commandName: string, command: Command): void {
	allCommands.set(commandName, {
		name: commandName,
		aliases: command.aliases,
		execute: jest.fn().mockResolvedValue(undefined)
	});
}

// Add all commands to our mock commands list
realAllCommands.forEach((cmd, key) => addMock(key, cmd));
