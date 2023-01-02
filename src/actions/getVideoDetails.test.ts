jest.mock("./network/getBandcampTrack.js");
jest.mock("./network/getPonyFmTrack.js");
jest.mock("./network/getSoundCloudTrack.js");
jest.mock("./network/getYouTubeVideo.js");

import { getBandcampTrack } from "./network/getBandcampTrack.js";
import { getPonyFmTrack } from "./network/getPonyFmTrack.js";
import { getSoundCloudTrack } from "./network/getSoundCloudTrack.js";
import { getYouTubeVideo } from "./network/getYouTubeVideo.js";
const mockGetBandcampTrack = getBandcampTrack as jest.Mock<Promise<VideoDetails>, [URL]>;
const mockGetPonyFmTrack = getPonyFmTrack as jest.Mock<Promise<VideoDetails>, [URL]>;
const mockGetSoundCloudTrack = getSoundCloudTrack as jest.Mock<Promise<VideoDetails>, [URL]>;
const mockGetYouTubeVideo = getYouTubeVideo as jest.Mock<Promise<VideoDetails>, [URL]>;

import type { VideoDetails } from "./getVideoDetails.js";
import { getVideoDetails } from "./getVideoDetails.js";
import { URL } from "node:url";
import { VideoError } from "../errors/VideoError.js";
import { useLogger } from "../logger.js";
import {
	expectDefined,
	expectNotNull,
	expectValueEqual
} from "../../tests/testUtils/expectations/jest.js";

const logger = useLogger();

describe("Video details", () => {
	describe("Mocked loaders", () => {
		const validUrl = new URL("https://example.com").href; // `URL` makes sure our test URL still passes Node's checks
		const details: VideoDetails = {
			duration: {
				seconds: 5
			},
			title: "Sample",
			url: validUrl
		};

		beforeEach(() => {
			// The URL check shouldn't come from the platform modules (by default) when testing
			mockGetBandcampTrack.mockResolvedValue(details);
			mockGetPonyFmTrack.mockResolvedValue(details);
			mockGetSoundCloudTrack.mockResolvedValue(details);
			mockGetYouTubeVideo.mockResolvedValue(details);
		});

		test.each`
			invalidUrl
			${"not a url"}
			${"lolz"}
			${"https://"}
			${""}
		`(
			"returns null from a non-URL '$invalidUrl'",
			async ({ invalidUrl }: { invalidUrl: string }) => {
				// Mocked modules don't return null, but the unit under test does
				await expect(getVideoDetails(invalidUrl, logger)).resolves.toBeNull();
			}
		);

		test("calls every video retrieval function with the given URL", async () => {
			await expect(getVideoDetails(validUrl, logger)).resolves.toBe(details);
			expect(mockGetBandcampTrack).toHaveBeenCalledOnce();
			expect(mockGetPonyFmTrack).toHaveBeenCalledOnce();
			expect(mockGetSoundCloudTrack).toHaveBeenCalledOnce();
			expect(mockGetYouTubeVideo).toHaveBeenCalledOnce();
			expect.assertions(5); // asserts that we've checked every platform module
		});

		test("returns null when every module throws", async () => {
			mockGetBandcampTrack.mockRejectedValueOnce(new VideoError("testing"));
			mockGetPonyFmTrack.mockRejectedValueOnce(new VideoError("testing"));
			mockGetSoundCloudTrack.mockRejectedValueOnce(new VideoError("testing"));
			mockGetYouTubeVideo.mockRejectedValueOnce(new VideoError("testing"));
			await expect(getVideoDetails(validUrl, null)).resolves.toBeNull();
		});

		test("returns video data from Bandcamp", async () => {
			await expect(getVideoDetails(validUrl, logger)).resolves.toBe(details);
		});

		test("returns video data from Pony.fm", async () => {
			await expect(getVideoDetails(validUrl, logger)).resolves.toBe(details);
		});

		test("returns video data from SoundCloud", async () => {
			await expect(getVideoDetails(validUrl, logger)).resolves.toBe(details);
		});

		test("returns video data from YouTube", async () => {
			await expect(getVideoDetails(validUrl, logger)).resolves.toBe(details);
		});
	});

	describe("Real loaders", () => {
		beforeEach(() => {
			// Import and use original implementations
			const { getBandcampTrack } = jest.requireActual<
				typeof import("./network/getBandcampTrack.js")
			>("./network/getBandcampTrack.js");
			const { getPonyFmTrack } = jest.requireActual<typeof import("./network/getPonyFmTrack.js")>(
				"./network/getPonyFmTrack.js"
			);
			const { getSoundCloudTrack } = jest.requireActual<
				typeof import("./network/getSoundCloudTrack.js")
			>("./network/getSoundCloudTrack.js");
			const { getYouTubeVideo } = jest.requireActual<typeof import("./network/getYouTubeVideo.js")>(
				"./network/getYouTubeVideo.js"
			);

			mockGetBandcampTrack.mockImplementationOnce(getBandcampTrack);
			mockGetPonyFmTrack.mockImplementationOnce(getPonyFmTrack);
			mockGetSoundCloudTrack.mockImplementationOnce(getSoundCloudTrack);
			mockGetYouTubeVideo.mockImplementationOnce(getYouTubeVideo);
		});

		test.each`
			platform                    | url                                                                                 | duration
			${"Bandcamp"}               | ${"https://4everfreebrony.bandcamp.com/track/wandering-eyes-2018-2 Text and stuff"} | ${216}
			${"Bandcamp custom-domain"} | ${"https://forestrainmedia.com/track/bad-wolf Text and stuff"}                      | ${277}
			${"Pony.fm (attempt 1)"}    | ${"https://pony.fm/t46025 Text and stuff"}                                          | ${385}
			${"Pony.fm (attempt 2)"}    | ${"https://pony.fm/t27293 Text and stuff"}                                          | ${251}
			${"SoundCloud"}             | ${"https://soundcloud.com/hwps/no999 Text and stuff"}                               | ${95}
			${"YouTube"}                | ${"https://youtu.be/9Y8ZGLiqXB8 Text and stuff"}                                    | ${346}
		`(
			"returns video data for a $platform link that has extra info",
			async ({ url, duration }: { url: string; duration: number }) => {
				const details = await getVideoDetails(url, logger);
				// URL will be trimmed
				expectNotNull(details);
				expectDefined(details.duration.seconds);
				expectValueEqual(details.duration.seconds, duration);
			},
			20000
		);
	});
});
