import { getPonyFmTrack } from "./getPonyFmTrack.js";
import { URL } from "node:url";
import { VideoError } from "../../errors/VideoError.js";

describe("Pony.FM track details", () => {
	test.each`
		desc                         | url
		${"album link"}              | ${"https://pony.fm/albums/4761-heroes-the-label-compilation"}
		${"artist page"}             | ${"https://pony.fm/skyshard"}
		${"playlist"}                | ${"https://pony.fm/playlist/566-all-violin-melodys-original-mixes-remixes"}
		${"about page"}              | ${"https://pony.fm/about"}
		${"tracks page"}             | ${"https://pony.fm/tracks/"}
		${"invalid track"}           | ${"https://pony.fm/tracks/54321"}
		${"invalid track shortlink"} | ${"https://pony.fm/t54321"}
	`("throws with Pony.fm $desc", async ({ url }: { desc: string; url: string }) => {
		await expect(() => getPonyFmTrack(new URL(url))).rejects.toThrow(VideoError);
	});

	test.each`
		desc                      | url
		${"long link"}            | ${"https://pony.fm/tracks/46025-beneath-the-sea-ft-lectro-dub-studio-quinn-liv-learn-zelizine"}
		${"incomplete long link"} | ${"https://pony.fm/tracks/46025-beneath-the-sea-ft-"}
		${"short link"}           | ${"https://pony.fm/t46025"}
	`(
		"returns correct length for $desc of Pony.fm track",
		async ({ url }: { desc: string; url: string }) => {
			const details = await getPonyFmTrack(new URL(url));
			expect(details).toHaveProperty(
				"url",
				"https://pony.fm/tracks/46025-beneath-the-sea-ft-lectro-dub-studio-quinn-liv-learn-zelizine"
			);
			expect(details?.duration.seconds).toBeDefined();
			expect(details?.duration.seconds).toBe(385);
		}
	);
});
