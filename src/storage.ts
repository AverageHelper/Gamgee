import storage from "node-persist";
import type { LocalStorage } from "node-persist";
export type Storage = LocalStorage;

let localStorage: LocalStorage | null = null;

/**
 * Initializes and returns the persistent storage container.
 */
export async function useStorage(): Promise<LocalStorage> {
  if (!localStorage) {
    await storage.init({
      dir: "./localStorage"
    });
    localStorage = storage;
  }

  return localStorage;
}
