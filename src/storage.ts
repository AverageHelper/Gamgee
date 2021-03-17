import Discord from "discord.js";
import storage from "node-persist";
import type { LocalStorage } from "node-persist";
export type Storage = LocalStorage;

const localStorageScopes = new Discord.Collection<string, LocalStorage>();

/**
 * Initializes and returns the persistent storage container for the given guild.
 */
export async function useStorage(guild: Discord.Guild | null): Promise<LocalStorage | null> {
  if (!guild) return null;

  let localStorage = localStorageScopes.get(guild.id);
  if (!localStorage) {
    await storage.init({
      dir: `./config/${guild.id}`
    });
    localStorageScopes.set(guild.id, storage);
    localStorage = storage;
  }

  return localStorage;
}
