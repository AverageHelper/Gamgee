import fs from "node:fs";

/**
 * Wraps Node's `fs.unlink` function in a `Promise` that ignores
 * `ENOENT` (file not found) errors.
 *
 * @param path The path of the filesystem item to unlink or remove.
 */
export async function fsUnlink(path: fs.PathLike): Promise<void> {
	return await new Promise((resolve, reject) => {
		fs.unlink(path, error => {
			if (error) {
				if (error.code === "ENOENT") {
					// File not found, move along.
					return resolve();
				}
				return reject(error);
			}
			return resolve();
		});
	});
}
