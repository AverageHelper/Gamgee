import type { Command } from "../Command.js";
import "../../../tests/testUtils/leakedHandles.js";

interface MockCommand {
	name: Command["name"];
	aliases?: Command["aliases"];
	nameLocalizations?: Command["nameLocalizations"];
	options: Command["options"];
	execute: jest.Mock;
}

export { invokeCommand } from "../../actions/invokeCommand.js";

const { allCommands: _allCommands, resolveAlias: _resolveAlias } =
	jest.requireActual<typeof import("../index.js")>("../index");

export function resolveAlias(alias: string): string {
	return _resolveAlias(alias, allCommands);
}

export const allCommands = new Map<string, MockCommand>();

function addMock(command: Command): void {
	allCommands.set(command.name, {
		name: command.name,
		aliases: command.aliases,
		options: command.options,
		nameLocalizations: command.nameLocalizations,
		execute: jest.fn().mockResolvedValue(undefined)
	});
}

// Add all commands to our mock commands list
_allCommands.forEach(cmd => addMock(cmd));
