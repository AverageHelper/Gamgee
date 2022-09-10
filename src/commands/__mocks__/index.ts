import type { Command } from "../Command.js";

interface MockCommand {
	name: Command["name"];
	aliases?: Command["aliases"];
	options: Command["options"];
	execute: jest.Mock;
}

export { invokeCommand } from "../../actions/invokeCommand.js";

const { allCommands: realAllCommands } =
	jest.requireActual<typeof import("../index.js")>("../index");

export function resolveAlias(alias: string): string {
	for (const [name, command] of allCommands) {
		const aliases = command.aliases ?? [];
		if (aliases.includes(alias)) {
			return name;
		}
	}
	return alias;
}

export const allCommands = new Map<string, MockCommand>();

function addMock(command: Command): void {
	allCommands.set(command.name, {
		name: command.name,
		aliases: command.aliases,
		options: command.options,
		execute: jest.fn().mockResolvedValue(undefined)
	});
}

// Add all commands to our mock commands list
realAllCommands.forEach(cmd => addMock(cmd));
