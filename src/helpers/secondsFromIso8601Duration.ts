import { Temporal } from "temporal-polyfill";

/**
 * Returns the number of seconds represented by the given string,
 * if the string is in ISO 8601 duration format.
 */
export function secondsFromIso8601Duration(durationString: string): number {
	const duration = Temporal.Duration.from(durationString);
	// const now = Temporal.Now.plainDateTime("gregory"); // Needed for durations that use larger units than Hour
	return duration.total({ unit: "seconds" /* relativeTo: now */ });
}
