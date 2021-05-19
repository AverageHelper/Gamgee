export const flushPromises = (): Promise<unknown> => new Promise(setImmediate);
