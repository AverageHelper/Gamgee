export default function mapSources<S extends Record<string, unknown>, K extends keyof S>(
	string: K | undefined,
	sourceMap: S | undefined
): S[K] | undefined {
	if (string === undefined || typeof string !== "string") return undefined;
	const _sourceMap = normalizeSourceMap(sourceMap ?? {});
	return _sourceMap[string.toLowerCase()] as S[K];
}

function normalizeSourceMap(sourceMap: Record<string, unknown>): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	// lowercase sourceMap keys
	const keys = Object.keys(sourceMap);
	keys.forEach(key => {
		result[key.toLowerCase()] = sourceMap[key];
	});
	return result;
}
