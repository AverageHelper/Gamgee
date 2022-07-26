import type { EntityTarget, EntityManager, Repository } from "typeorm";
import { dataSource, initialize } from "./sqliteDataSource.js";

export async function useRepository<Entity, T = undefined>(
	targetOrRepository: EntityTarget<Entity> | Repository<Entity>,
	cb: (repository: Repository<Entity>) => T | Promise<T>
): Promise<T> {
	await initialize();

	// eslint-disable-next-line @typescript-eslint/no-base-to-string
	// logger.debug(`Using DB repository: ${targetOrRepository.toString()}`);
	if (typeof targetOrRepository !== "string" && "manager" in targetOrRepository) {
		return await cb(targetOrRepository);
	}
	return await cb(dataSource.getRepository(targetOrRepository));
}

export async function useTransaction<T = undefined>(
	cb: (entityManager: EntityManager) => T | Promise<T>
): Promise<T> {
	await initialize();

	// logger.debug(`Using DB transaction`);
	return await dataSource.transaction(async transaction => {
		return await cb(transaction);
	});
}
