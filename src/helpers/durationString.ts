import humanize from "humanize-duration";
import { MILLISECONDS_IN_SECOND } from "../constants/time.js";

function shortDurationString(seconds: number): string {
	if (Number.isNaN(seconds)) return "NaN";
	return new Date(1000 * seconds).toISOString().slice(11, 19);
}

/**
 * Returns a string representing the given number of seconds in a
 * natural format to express lengths of time.
 *
 * @param seconds The number of seconds to format.
 * @param short Whether the resulting string should be in a short format.
 *
 * @returns A user-readable string describing the number of seconds.
 */
export function durationString(seconds: number, short: boolean = false): string {
	if (short) {
		return shortDurationString(seconds);
	}
	if (Number.isNaN(seconds)) return "NaN seconds";
	return humanize(seconds * MILLISECONDS_IN_SECOND, { round: true });
}

export default durationString;
