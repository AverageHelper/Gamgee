import { dataSource } from "./sqliteDataSource.js";

type Prefixed<P extends string> = `${P}${string}`;
type WithoutPrefixedKeys<T, P extends string> = Omit<T, Prefixed<P>>;

// Find properties of dataSource that aren't prefixed. These are our own schema interfaces, defined in prisma/schema.prisma
type EntityKeys = keyof WithoutPrefixedKeys<typeof dataSource, "$">;

/**
 * Calls a given callback with a CRUD interface for working with a database table.
 *
 * @param table A string that identifies the database table on which to operate.
 * @param cb A callback that receives a CRUD interface for the given `table` key.
 * @returns A `Promise` that resolves with the value returned by the callback.
 */
export async function useRepository<Entity extends EntityKeys, T = undefined>(
	table: Entity,
	cb: (repository: typeof dataSource[Entity]) => T | Promise<T>
): Promise<T> {
	return await cb(dataSource[table]);
}
