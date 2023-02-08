import "../../../tests/testUtils/leakedHandles.js";
import { expectDefined, expectValueEqual } from "../../../tests/testUtils/expectations/jest.js";
import { getPonyFmTrack } from "./getPonyFmTrack.js";
import { URL } from "node:url";
import { VideoError } from "../../errors/VideoError.js";

describe("Pony.FM track details", () => {
	const TIMEOUT = 50; // seconds

	test.skip.each`
		desc                         | url
		${"album link"}              | ${"https://pony.fm/albums/4761-heroes-the-label-compilation"}
		${"artist page"}             | ${"https://pony.fm/skyshard"}
		${"playlist"}                | ${"https://pony.fm/playlist/566-all-violin-melodys-original-mixes-remixes"}
		${"about page"}              | ${"https://pony.fm/about"}
		${"tracks page"}             | ${"https://pony.fm/tracks/"}
		${"invalid track"}           | ${"https://pony.fm/tracks/54321"}
		${"invalid track shortlink"} | ${"https://pony.fm/t54321"}
	`(
		"throws with Pony.fm $desc",
		async ({ url }: { desc: string; url: string }) => {
			await expect(() => getPonyFmTrack(new URL(url), TIMEOUT)).rejects.toThrow(VideoError);
		},
		20000
	);

	test.skip.each`
		desc                      | url
		${"long link"}            | ${"https://pony.fm/tracks/46025-beneath-the-sea-ft-lectro-dub-studio-quinn-liv-learn-zelizine"}
		${"incomplete long link"} | ${"https://pony.fm/tracks/46025-beneath-the-sea-ft-"}
		${"short link"}           | ${"https://pony.fm/t46025"}
	`(
		"returns correct length for $desc of Pony.fm track",
		async ({ url }: { desc: string; url: string }) => {
			const details = await getPonyFmTrack(new URL(url), TIMEOUT);
			expectValueEqual(
				details.url,
				"https://pony.fm/tracks/46025-beneath-the-sea-ft-lectro-dub-studio-quinn-liv-learn-zelizine"
			);
			expectDefined(details.duration.seconds);
			expectValueEqual(details.duration.seconds, 385);
		},
		20000
	);
});
