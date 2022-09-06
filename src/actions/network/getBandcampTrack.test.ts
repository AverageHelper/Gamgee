import { benchmark } from "../../../tests/testUtils/benchmark.js";
import { getBandcampTrack } from "./getBandcampTrack.js";
import { URL } from "node:url";
import { VideoError } from "../../errors/VideoError.js";

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
			expect(details).toHaveProperty("url", url);
			expect(details?.duration.seconds).toBeDefined();
			expect(details?.duration.seconds).toBe(duration);
		}
	);

	const ms = 650;
	test(`runs in a reasonable amount of time (less than ${ms}ms)`, async () => {
		const url = new URL("https://poniesatdawn.bandcamp.com/track/let-the-magic-fill-your-soul");

		// Sanity: check that this is still the right track
		const duration = 233;
		const song = await getBandcampTrack(url);
		expect(song.duration.seconds).toBe(duration);

		// Benchmark the fetch operation
		const average = await benchmark(() => getBandcampTrack(url));

		expect(average).toBeLessThan(ms);
	}, 20000);
});
