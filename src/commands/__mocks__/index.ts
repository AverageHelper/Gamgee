import type { Command } from "../Command.js";
import type { Mock } from "vitest";
import { vi } from "vitest";

interface MockCommand {
	name: Command["name"];
	aliases?: Command["aliases"];
	nameLocalizations?: Command["nameLocalizations"];
	options: Command["options"];
	execute: Mock<Command["execute"]>;
}

export { invokeCommand } from "../../actions/invokeCommand.js";

const { allCommands: _allCommands, resolveAlias: _resolveAlias } =
	await vi.importActual<typeof import("../index.js")>("../index.js");

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
		execute: vi.fn<Command["execute"]>().mockResolvedValue(undefined),
	});
}

// Add all commands to our mock commands list
_allCommands.forEach(cmd => addMock(cmd));
