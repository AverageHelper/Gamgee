import type { VideoDetails } from "./getVideoDetails.js";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { VideoError } from "../errors/VideoError.js";

vi.mock("./network/getBandcampTrack.js", () => ({ getBandcampTrack: vi.fn() }));
vi.mock("./network/getPonyFmTrack.js", () => ({ getPonyFmTrack: vi.fn() }));
vi.mock("./network/getSoundCloudTrack.js", () => ({ getSoundCloudTrack: vi.fn() }));
vi.mock("./network/getYouTubeVideo.js", () => ({ getYouTubeVideo: vi.fn() }));

import { getBandcampTrack } from "./network/getBandcampTrack.js";
import { getPonyFmTrack } from "./network/getPonyFmTrack.js";
import { getSoundCloudTrack } from "./network/getSoundCloudTrack.js";
import { getYouTubeVideo } from "./network/getYouTubeVideo.js";
const mockGetBandcampTrack = getBandcampTrack as Mock<[URL], Promise<VideoDetails>>;
const mockGetPonyFmTrack = getPonyFmTrack as Mock<[URL], Promise<VideoDetails>>;
const mockGetSoundCloudTrack = getSoundCloudTrack as Mock<[URL], Promise<VideoDetails>>;
const mockGetYouTubeVideo = getYouTubeVideo as Mock<[URL], Promise<VideoDetails>>;

import { getVideoDetails } from "./getVideoDetails.js";

describe("Video details", () => {
	const validUrl = new URL("https://example.com").href; // Sanity check: use `URL` to make sure Node agrees this URL is valid
	const details: VideoDetails = {
		duration: { seconds: 5 },
		title: "Sample",
		url: validUrl,
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
	`("returns null from a non-URL '$invalidUrl'", async ({ invalidUrl }: { invalidUrl: string }) => {
		// Our mocked modules don't return null, but the unit under test does
		await expect(getVideoDetails(invalidUrl, null)).resolves.toBeNull();
	});

	test("calls every video retrieval function with the given URL", async () => {
		await expect(getVideoDetails(validUrl, null)).resolves.toBe(details);
		expect(mockGetBandcampTrack).toHaveBeenCalledOnce();
		expect(mockGetPonyFmTrack).toHaveBeenCalledOnce();
		expect(mockGetSoundCloudTrack).toHaveBeenCalledOnce();
		expect(mockGetYouTubeVideo).toHaveBeenCalledOnce();
	});

	test("returns null when every module throws", async () => {
		mockGetBandcampTrack.mockRejectedValueOnce(new VideoError("testing"));
		mockGetPonyFmTrack.mockRejectedValueOnce(new VideoError("testing"));
		mockGetSoundCloudTrack.mockRejectedValueOnce(new VideoError("testing"));
		mockGetYouTubeVideo.mockRejectedValueOnce(new VideoError("testing"));
		await expect(getVideoDetails(validUrl, null)).resolves.toBeNull();
	});

	const urls = [
		["Bandcamp", "https://4everfreebrony.bandcamp.com/track/wandering-eyes-2018-2"],
		["Bandcamp custom-domain", "https://forestrainmedia.com/track/bad-wolf"],
		["SoundCloud", "https://soundcloud.com/hwps/no999"],
		["YouTube", "https://youtu.be/9RAQsdTQIcs"],
		["Pony.fm", "https://pony.fm/t46025"],
	] as const;
	test.each(urls)("strips extra info from a %s URL", async (_, url) => {
		const dirtyUrl = `${url} Text and stuff`;
		const cleanUrl = new URL(url);
		const signal = expect.any(AbortSignal) as AbortSignal;

		await expect(getVideoDetails(dirtyUrl, null)).resolves.toMatchObject({ url: validUrl });
		expect(mockGetBandcampTrack).toHaveBeenCalledOnce();
		expect(mockGetBandcampTrack).toHaveBeenCalledWith(cleanUrl, signal);

		expect(mockGetPonyFmTrack).toHaveBeenCalledOnce();
		expect(mockGetPonyFmTrack).toHaveBeenCalledWith(cleanUrl, signal);

		expect(mockGetSoundCloudTrack).toHaveBeenCalledOnce();
		expect(mockGetSoundCloudTrack).toHaveBeenCalledWith(cleanUrl, signal);

		expect(mockGetYouTubeVideo).toHaveBeenCalledOnce();
		expect(mockGetYouTubeVideo).toHaveBeenCalledWith(cleanUrl, signal);
	});
});
