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

describe("Video details", () => {
	beforeEach(() => {
		mockGetBandcampTrack.mockRejectedValue(new VideoError("testing"));
		mockGetPonyFmTrack.mockRejectedValue(new VideoError("testing"));
		mockGetSoundCloudTrack.mockRejectedValue(new VideoError("testing"));
		mockGetYouTubeVideo.mockRejectedValue(new VideoError("testing"));
	});

	const realUrl = new URL("https://example.com").href; // `URL` makes sure our test URL still passes Node's checks
	const details: VideoDetails = {
		duration: {
			seconds: 5
		},
		title: "Sample",
		url: realUrl
	};

	test.each`
		nonUrl
		${"not a url"}
		${"lolz"}
		${"https://"}
		${""}
	`("returns null from a non-URL '$nonUrl'", async ({ nonUrl }: { nonUrl: string }) => {
		// The URL check shouldn't come from the platform modules
		mockGetBandcampTrack.mockResolvedValue(details);
		mockGetPonyFmTrack.mockResolvedValue(details);
		mockGetSoundCloudTrack.mockResolvedValue(details);
		mockGetYouTubeVideo.mockResolvedValue(details);

		// Mocked modules don't return null, but the unit under test does
		await expect(getVideoDetails(nonUrl, null)).resolves.toBeNull();
	});

	test("calls every video retrieval function with the given URL", async () => {
		await expect(getVideoDetails(realUrl, null)).resolves.toBeNull();
		expect(mockGetBandcampTrack).toHaveBeenCalledOnce();
		expect(mockGetPonyFmTrack).toHaveBeenCalledOnce();
		expect(mockGetSoundCloudTrack).toHaveBeenCalledOnce();
		expect(mockGetYouTubeVideo).toHaveBeenCalledOnce();
		expect.assertions(5); // asserts that we've checked every platform module
	});

	test("returns null when every module throws", async () => {
		// ASSUMPTION: `beforeEach` sets modules to throw by default
		await expect(getVideoDetails(realUrl, null)).resolves.toBeNull();
	});

	test("returns video data from Bandcamp", async () => {
		mockGetBandcampTrack.mockResolvedValue(details);
		await expect(getVideoDetails(realUrl, null)).resolves.toBe(details);
	});

	test("returns video data from Pony.fm", async () => {
		mockGetPonyFmTrack.mockResolvedValue(details);
		await expect(getVideoDetails(realUrl, null)).resolves.toBe(details);
	});

	test("returns video data from SoundCloud", async () => {
		mockGetSoundCloudTrack.mockResolvedValue(details);
		await expect(getVideoDetails(realUrl, null)).resolves.toBe(details);
	});

	test("returns video data from YouTube", async () => {
		mockGetYouTubeVideo.mockResolvedValue(details);
		await expect(getVideoDetails(realUrl, null)).resolves.toBe(details);
	});
});
