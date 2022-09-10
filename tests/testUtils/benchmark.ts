/** Returns the average of the numbers in the array. */
function averageIn(array: Array<number>): number {
	const total: number = array.reduce((sum, curr) => sum + curr, 0);
	return total / array.length;
}

/**
 * Returns the average runtime of the given `op` after the number of `runs`.
 *
 * @param op The function to run. The return value is ignored, except that
 * returned promises are awaited.
 * @param runs The number of times to run the function. Must be greater than
 * `0`. The default value is `5`.
 */
export async function benchmark(
	op: () => Promise<unknown> | unknown,
	runs: number = 5
): Promise<number> {
	if (runs <= 0) throw new TypeError(`runs must be greater than 0. Received ${runs}`);
	const times: Array<[start: number, end: number]> = [];

	for (let _ = 0; _ < runs; _ += 1) {
		const start = Date.now();

		// run the unit
		await op();

		const end = Date.now();
		times.push([start, end]);
	}

	const durations = times.map(([start, end]) => end - start);
	return averageIn(durations);
}
