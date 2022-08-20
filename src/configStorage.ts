//
// TODO: THIS FILE TO BE REMOVED IN THE NEXT SEMVER MAJOR VERSION
//

import type { LocalStorage } from "node-persist";
import type { Logger } from "./logger.js";
import type Discord from "discord.js";
import { isError } from "./helpers/isError.js";
import { opendir } from "node:fs/promises";
import { resolve } from "node:path";
import storage from "node-persist";

export type Storage = LocalStorage;

const localStorageScopes = new Map<string, LocalStorage>();

export const PATH_TO_LEGACY_CONFIG = resolve(__dirname, "..", "./config");

async function folderTreeHasFiles(path: string, logger: Logger): Promise<boolean> {
	const dir = await opendir(path);
	logger.debug(`Opened dir '${path}'`);
	for await (const ent of dir) {
		if (ent.isFile()) {
			logger.debug(`Legacy config file '${ent.name}' found.`);
			return true; // found a file!
		}
		if (ent.isDirectory() && !ent.isSymbolicLink()) {
			// consult the dir. If files found, found a file!
			if (await folderTreeHasFiles(resolve(path, ent.name), logger)) return true;
		}
	}

	logger.debug(`Folder ${path} is empty`);
	// checked every folder, found no files
	return false;
}

/** Resolves to `true` if a legacy config folder exists. */
export async function hasLegacyConfig(logger: Logger): Promise<boolean> {
	try {
		// We "have a config" if there's anything stored in the config folder or subfolders
		return await folderTreeHasFiles(PATH_TO_LEGACY_CONFIG, logger);
	} catch (error) {
		if (isError(error) && error.code === "ENOENT") {
			return false; // nothing's there
		}
		throw error; // something else went wrong
	}
}

/**
 * Initializes and returns the persistent storage container for the given guild.
 *
 * @deprecated Use a proper database instead
 */
export async function useStorage(
	guild: Discord.Guild | null,
	logger: Logger
): Promise<LocalStorage | null> {
	if (!guild) return null;

	let localStorage = localStorageScopes.get(guild.id);
	if (!localStorage) {
		await storage.init({
			dir: `./config/${guild.id}`
		});
		localStorageScopes.set(guild.id, storage);
		logger.debug(`Initialized legacy storage for guild ${guild.id} (${guild.name})`);
		localStorage = storage;
	}

	return localStorage;
}
