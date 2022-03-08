export function cleanTitleString(value: string): string {
	if (typeof value !== "string") return value;
	// remove any newline characters, replace with space:
	value = value.replace(/\n|\r/gmu, " ");
	// remove double (or more) spaces, replace with single space:
	value = value.replace(/( {2,})/gmu, " ");
	return value;
}

export function truncate(value: string, length: number = Number.MAX_SAFE_INTEGER): string {
	if (typeof value !== "string") return "";
	if (value.length <= length) return value;
	return value.slice(0, Math.max(0, length));
}

export function ensureSecureImageRequest(src: string): string {
	if (src && src.indexOf("//") > 0) {
		const arr = src.split("//");
		arr[0] = "https:";
		src = arr.join("//");
	}
	return src;
}
