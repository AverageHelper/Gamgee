import isError from "./isError";

export class AggregateError extends Error {
  errors: ReadonlyArray<unknown>;

  constructor(errors: Array<unknown>) {
    super(
      `No promises resolved successfully: ${JSON.stringify(
        errors.map(err => {
          if (isError(err)) {
            return `${err.name}: ${err.message}`;
          }
          return `${typeof err}: ${JSON.stringify(err, undefined, 2)}`;
        }),
        undefined,
        2
      )}`
    );
    this.errors = errors;
    this.name = "AggregateError";
  }
}

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
