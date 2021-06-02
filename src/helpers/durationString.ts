import humanize from "humanize-duration";
import { MILLISECONDS_IN_SECOND } from "../constants/time";

/**
 * Returns a string representing the given number of seconds in a
 * natural format to express lengths of time.
 *
 * @param seconds The number of seconds to format.
 *
 * @returns A user-readable string describing the number of seconds.
 */
export default function durationString(seconds: number): string {
	return humanize(seconds * MILLISECONDS_IN_SECOND, { round: true });
}
