import { benchmark } from "../../../tests/testUtils/benchmark.js";
import { getBandcampTrack } from "./getBandcampTrack.js";
import { URL } from "node:url";
import { VideoError } from "../../errors/VideoError.js";
import {
	expectDefined,
	expectLessThan,
	expectValueEqual
} from "../../../tests/testUtils/expectations/jest.js";

describe("Bandcamp track details", () => {
	test("throws for bandcamp album links", async () => {
		const url = "https://poniesatdawn.bandcamp.com/album/memories";
		await expect(() => getBandcampTrack(new URL(url))).rejects.toThrow(VideoError);
	});

	test.each`
		url                                                                             | duration
		${"https://poniesatdawn.bandcamp.com/track/let-the-magic-fill-your-soul"}       | ${233}
		${"https://forestrainmedia.com/track/bad-wolf"}                                 | ${277}
		${"https://lehtmojoe.bandcamp.com/track/were-not-going-home-dallas-stars-2020"} | ${170}
	`(
		"returns info for Bandcamp track $url, $duration seconds long",
		async ({ url, duration }: { url: string; duration: number }) => {
			const details = await getBandcampTrack(new URL(url));
			expectValueEqual(details.url, url);
			expectDefined(details.duration.seconds);
			expectValueEqual(details.duration.seconds, duration);
		}
	);

	const ms = 650;
	test(`runs in a reasonable amount of time (less than ${ms}ms)`, async () => {
		const url = new URL("https://poniesatdawn.bandcamp.com/track/let-the-magic-fill-your-soul");

		// Sanity: check that this is still the right track
		const duration = 233;
		const song = await getBandcampTrack(url);
		expectValueEqual(song.duration.seconds, duration);

		// Benchmark the fetch operation
		const average = await benchmark(() => getBandcampTrack(url));

		expectLessThan(average, ms);
	}, 20000);
});
