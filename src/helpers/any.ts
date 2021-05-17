import { AggregateError } from "typescript-promise-any";

/**
 * See https://esdiscuss.org/topic/promise-any#content-0
 *
 * @param promises An array of promises.
 * @returns a new `Promise` that resolves to the value of the first provided
 * promise to resolve successfully.
 */
export default async function any<T>(promises: Array<Promise<T>>): Promise<T> {
  return new Promise((resolve, reject) => {
    const allErrors: Array<unknown> = [];
    let count = promises.length;
    let resolved = false;

    for (const p of promises) {
      // eslint-disable-next-line promise/prefer-await-to-then
      void Promise.resolve(p).then(
        value => {
          resolved = true;
          count -= 1;
          resolve(value);
        },
        (error: unknown) => {
          count -= 1;
          allErrors.push(error);
          if (count === 0 && !resolved) {
            reject(new AggregateError(allErrors));
          }
        }
      );
    }
  });
}
