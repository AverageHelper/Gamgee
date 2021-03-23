import fs from "fs";

export function fsUnlink(path: fs.PathLike): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.unlink(path, error => {
      if (error) {
        if (error.code === "ENOENT") {
          // File not found, move along.
          return resolve();
        }
        return reject(error);
      } else {
        return resolve();
      }
    });
  });
}
