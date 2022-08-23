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
});
