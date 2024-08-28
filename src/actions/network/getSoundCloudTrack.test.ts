import type { Song, SongInfoOptions } from "soundcloud-scraper";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { expectDefined, expectValueEqual } from "../../../tests/testUtils/expectations.js";

// Mock fetch
const mockFetch = vi.spyOn(global, "fetch");

// Mock SoundCloud client
const mockGetSongInfo = vi.fn<
	[url: string, options?: SongInfoOptions | undefined],
	Promise<Song>
>();
const MockSoundCloudClient = vi.hoisted(
	() =>
		class MockSoundCloudClient {
			getSongInfo = mockGetSongInfo;
		},
);

vi.mock("soundcloud-scraper", () => ({ Client: MockSoundCloudClient }));

// Import the unit under test
import { getSoundCloudTrack } from "./getSoundCloudTrack.js";

describe("SoundCloud track details", () => {
	const url = "https://soundcloud.com/hwps/no999";

	beforeEach(() => {
		// Pretend we never redirect at all, just respond with the given URL
		mockFetch.mockImplementation(url => {
			if (url instanceof Request) {
				return Promise.resolve({ url: url.url } as unknown as Response);
			} else if (typeof url === "string") {
				return Promise.resolve({ url } as unknown as Response);
			}
			return Promise.resolve({ url: url.href } as unknown as Response);
		});

		mockGetSongInfo.mockRejectedValue(new Error("Please mock a response."));
	});

	test.each`
		desc                  | url                                                                                                  | result                                                                         | duration
		${"is valid"}         | ${url}                                                                                               | ${url}                                                                         | ${95}
		${"has query params"} | ${"https://soundcloud.com/sparkeemusic/deadmau5-strobe-sparkee-nudisco-remix?ref=clipboard&p=i&c=0"} | ${"https://soundcloud.com/sparkeemusic/deadmau5-strobe-sparkee-nudisco-remix"} | ${219}
		${"has query params"} | ${"https://soundcloud.com/hollmusic/hol-x-afk-critical?si=5e39c7c7e7764f32b325c514cf19757e"}         | ${"https://soundcloud.com/hollmusic/hol-x-afk-critical"}                       | ${189}
	`(
		"returns info for a SoundCloud link that $desc, $duration seconds long",
		async ({ url, result, duration }: { url: string; result: string; duration: number }) => {
			const cleanUrl = new URL(url);
			cleanUrl.search = "";
			mockGetSongInfo.mockResolvedValue({
				url: cleanUrl.href,
				title: "sample",
				duration: duration * 1000,
			} as unknown as Song);

			const details = await getSoundCloudTrack(new URL(url));
			expectValueEqual(details.url, result);
			expectDefined(details.duration.seconds);
			expectValueEqual(details.duration.seconds, duration);
		},
	);

	test.each`
		url                                                  | result
		${"https://soundcloud.app.goo.gl/rDUoyrX52jAXwRDt6"} | ${"https://soundcloud.com/sparkeemusic/deadmau5-strobe-sparkee-nudisco-remix"}
		${"https://soundcloud.app.goo.gl/sRGYg37yafy3GVoC7"} | ${"https://soundcloud.com/zoltrag/shirk-haunted"}
		${"https://soundcloud.app.goo.gl/87dF3tEe353HkEBNA"} | ${"https://soundcloud.com/radiarc/ex-nocte"}
		${"https://soundcloud.app.goo.gl/TFifgUex2VxKxwqZ7"} | ${"https://soundcloud.com/user-417212429-654736718/spy-vs-spy-c64-remix-lukhash"}
	`(
		"returns info for a link shared from SoundCloud's mobile app: $url ~> $result",
		async ({ url, result }: { url: string; result: string }) => {
			mockGetSongInfo.mockResolvedValue({
				url: result,
				title: "sample",
				duration: 5_000, // sample
			} as unknown as Song);

			const details = await getSoundCloudTrack(new URL(url));
			expectValueEqual(details.url, result);
			expect(details.duration.seconds).not.toBe(true);
			expect(details.duration.seconds).not.toBeNaN();
			expect(details.duration.seconds).not.toBe(Number.POSITIVE_INFINITY);
			expect(details.duration.seconds).toBeGreaterThan(0);
		},
	);
});
