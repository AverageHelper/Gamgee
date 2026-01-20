import type { Mock } from "vitest";
import type { videoInfo } from "ytdl-core";
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi, afterEach } from "vitest";
import { expectDefined, expectValueEqual } from "../../../tests/testUtils/expectations.js";
import { InvalidYouTubeUrlError, UnavailableError } from "../../errors/index.js";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node"; // eslint-disable-line import/extensions
import { Temporal } from "temporal-polyfill";
import type { YoutubeDataApiResponse } from "./youtubeMethods/getYouTubeVideoViaApi.js";

// Mock logger
const mockLogger = vi.fn().mockReturnValue({ debug: vi.fn(), error: vi.fn() });
vi.mock("../../logger.js", () => ({ useLogger: mockLogger }));

// Mock YouTube API
const restHandlers = [
	http.get("https://www.googleapis.com/youtube/v3/videos", ({ request }) => {
		const url = new URL(request.url);

		const videoId = url.searchParams.get("id");
		if (!videoId) {
			return new HttpResponse(null, { status: 400 });
		}

		let hasVideo = true;
		let title: string | null = null;
		let liveBroadcastContent: YoutubeDataApiResponse["items"][0]["snippet"]["liveBroadcastContent"] =
			"none";
		let duration: number = -1;
		let regionRestriction: YoutubeDataApiResponse["items"][0]["contentDetails"]["regionRestriction"];

		switch (videoId) {
			case "9RAQsdTQIcs": {
				title = "Luna's Banishment - Deep Edition [SFM]";
				duration = 174;
				break;
			}
			case "9Y8ZGLiqXB8": {
				title = "Hades [METAL] - Out of Tartarus";
				duration = 346;
				break;
			}
			case "2rzoPFLRhqE": {
				title = "STARBOY on Triple Neck Guitar (The Weeknd ft. Daft Punk) - Luca Stricagnoli";
				duration = 225;
				break;
			}
			case "nY1WVAoMnYc": {
				title = "Let it Go (Disney's Frozen) POWER METAL COVER by Jonathan Young";
				duration = 216;
				break;
			}
			case "NFw-FrYmAEw": {
				title = "elda Ocarina of Time - MASSIVE MEDLEY! - Super Guitar Bros";
				duration = 1980;
				break;
			}
			case "GgwUenaQqlM": {
				title =
					"ヒロアカ「Hero too」ミュージックビデオ(MV)／雄英高校ヒーロー科1年A組／『僕のヒーローアカデミア』4期文化祭編／MY HEROACADEMIA";
				duration = 267;
				break;
			}
			case "5XbLY7IIqkY": {
				title = "DOOM Eternal OST 22: The Only Thing They Fear Is You (ARC Complex Theme)";
				duration = 426;
				break;
			}

			// Livestreams
			case "jfKfPfyJRdk": {
				title = "lofi hip hop radio - beats to relax/study to";
				liveBroadcastContent = "live";
				duration = 0;
				regionRestriction = {
					allowed: ["US"],
				};
				break;
			}

			// Unavailable videos
			case "9Y8ZGLiqXba": {
				// Upcoming livestream
				title = "Example Livestream";
				liveBroadcastContent = "upcoming";
				break;
			}
			case "dmneTS-Gows": {
				// Blocked in the US
				title = "Dead To The World";
				regionRestriction = {
					blocked: ["US"],
				};
				break;
			}

			default: {
				hasVideo = false;
				break;
			}
		}

		return HttpResponse.json({
			kind: "youtube#videoListResponse",
			items: hasVideo
				? [
						{
							id: videoId,
							snippet: {
								title,
								liveBroadcastContent,
							},
							contentDetails: {
								duration: Temporal.Duration.from({ seconds: duration }).toString(),
								regionRestriction,
							},
						},
					]
				: [],
		});
	}),
];

const youtube = setupServer(...restHandlers);

// Mock ytdl
vi.mock("ytdl-core", async () => ({
	validateURL: (await vi.importActual<typeof import("ytdl-core")>("ytdl-core")).validateURL,
	getBasicInfo: vi.fn(),
	getURLVideoID: (await vi.importActual<typeof import("ytdl-core")>("ytdl-core")).getURLVideoID,
}));
import { getBasicInfo } from "ytdl-core";
const mockGetBasicInfo = getBasicInfo as Mock<typeof getBasicInfo>;

// Mock env
import type { getEnv as _getEnv } from "../../helpers/environment.js";
const mockGetEnv = vi.fn<typeof _getEnv>();
mockGetEnv.mockReturnValue(undefined);
vi.mock("../../helpers/environment.js", () => ({ getEnv: mockGetEnv }));

const { requireEnv } = await vi.importActual<typeof import("../../helpers/environment.js")>(
	"../../helpers/environment.js",
);

// Import the unit under test
const { getYouTubeVideo } = await import("./getYouTubeVideo.js");

describe.each([true, false])("YouTube track details (API: %s)", withKey => {
	beforeAll(() => {
		youtube.listen({ onUnhandledRequest: "bypass" });
	});

	afterAll(() => {
		youtube.close();
	});

	beforeEach(() => {
		if (withKey) {
			const YOUTUBE_API_KEY = requireEnv("YOUTUBE_API_KEY");
			mockGetEnv.mockReturnValue(YOUTUBE_API_KEY);
		}
		mockGetBasicInfo.mockRejectedValue(new Error("Please mock a response."));
	});

	afterEach(() => {
		youtube.resetHandlers();
	});

	test.each`
		id               | url
		${"9Y8ZGLiqXBJ"} | ${"https://youtu.be/9Y8ZGLiqXBJ"}
		${"9Y8ZGLiqXBK"} | ${"https://www.youtube.com/watch?v=9Y8ZGLiqXBK"}
	`("throws with nonexistent video ($id)", async ({ url }: { url: string }) => {
		const error = new UnavailableError(new URL(url));
		mockGetBasicInfo.mockRejectedValue(error);
		await expect(() => getYouTubeVideo(new URL(url))).rejects.toThrow(error);
	});

	test.each`
		id               | url
		${"9Y8ZGLiqXba"} | ${"https://youtu.be/9Y8ZGLiqXba"}
		${"dmneTS-Gows"} | ${"https://www.youtube.com/watch?v=dmneTS-Gows"}
	`("throws with unavailable video ($id)", async ({ url }: { url: string }) => {
		const error = new UnavailableError(new URL(url));
		mockGetBasicInfo.mockRejectedValue(error);
		await expect(() => getYouTubeVideo(new URL(url))).rejects.toThrow(error);
	});

	test.each`
		desc                | url                                                                            | error
		${"SoundCloud URL"} | ${"https://soundcloud.com/sparkeemusic/deadmau5-strobe-sparkee-nudisco-remix"} | ${InvalidYouTubeUrlError}
		${"too-short URL"}  | ${"https://www.youtube.com/watch?v=9Y8ZGL"}                                    | ${InvalidYouTubeUrlError}
	`("throws with $desc", async ({ url, error }: { url: string; error: typeof Error }) => {
		// should throw due to a local check, shouldn't have to mock the network response here
		await expect(() => getYouTubeVideo(new URL(url))).rejects.toThrow(error);
	});

	const url = "https://www.youtube.com/watch?v=9Y8ZGLiqXB8";

	test.each`
		desc                                      | url                                                                                                                    | result                                           | duration
		${"is already good"}                      | ${"https://youtube.com/watch?v=9RAQsdTQIcs"}                                                                           | ${"https://www.youtube.com/watch?v=9RAQsdTQIcs"} | ${174}
		${"is for mobile"}                        | ${"https://m.youtube.com/watch?v=9Y8ZGLiqXB8"}                                                                         | ${url}                                           | ${346}
		${"is shortened"}                         | ${"https://youtu.be/9Y8ZGLiqXB8"}                                                                                      | ${url}                                           | ${346}
		${"has extra info"}                       | ${"https://youtu.be/9Y8ZGLiqXB8 Text and stuff"}                                                                       | ${url}                                           | ${346}
		${"spams repeat characters"}              | ${"https://youtu.be/9Y8ZGLiqXB8!!!!!!!!!!!!!!!!!!!!!!!!!!!!"}                                                          | ${url}                                           | ${346}
		${"spams random characters"}              | ${"https://youtu.be/9Y8ZGLiqXB8kdasu997ru53"}                                                                          | ${url}                                           | ${346}
		${"is a playlist"}                        | ${"https://www.youtube.com/watch?v=2rzoPFLRhqE&list=RDMM&start_radio=1&ab_channel=LucaStricagnoli"}                    | ${"https://www.youtube.com/watch?v=2rzoPFLRhqE"} | ${225}
		${"has channel info"}                     | ${"https://www.youtube.com/watch?v=nY1WVAoMnYc&ab_channel=JonathanYoung"}                                              | ${"https://www.youtube.com/watch?v=nY1WVAoMnYc"} | ${216}
		${"has time codes"}                       | ${"https://www.youtube.com/watch?v=NFw-FrYmAEw&t=10s"}                                                                 | ${"https://www.youtube.com/watch?v=NFw-FrYmAEw"} | ${1980}
		${"is shortened w/ unicode title"}        | ${"https://youtu.be/GgwUenaQqlM"}                                                                                      | ${"https://www.youtube.com/watch?v=GgwUenaQqlM"} | ${267}
		${"is a playlist entry w/ unicode title"} | ${"https://www.youtube.com/watch?v=GgwUenaQqlM&list=PLOKsOCrQbr0OCj6faA0kck1LwhQW-aj63&index=5"}                       | ${"https://www.youtube.com/watch?v=GgwUenaQqlM"} | ${267}
		${"has extra info w/ unicode title"}      | ${"https://www.youtube.com/watch?v=GgwUenaQqlM&ab_channel=TOHOanimation%E3%83%81%E3%83%A3%E3%83%B3%E3%83%8D%E3%83%AB"} | ${"https://www.youtube.com/watch?v=GgwUenaQqlM"} | ${267}
		${"is a short livestream VOD"}            | ${"https://youtu.be/5XbLY7IIqkY"}                                                                                      | ${"https://www.youtube.com/watch?v=5XbLY7IIqkY"} | ${426}
	`(
		"returns info for a YouTube link that $desc, $duration seconds long",
		async ({ url, result, duration }: { url: string; result: string; duration: number }) => {
			// These links *should* work on real YouTube, but we shouldn't hit the network while testing
			mockGetBasicInfo.mockResolvedValue({
				videoDetails: {
					availableCountries: [
						/* ... */ "US" /* ... */, // truncated for testing purposes
					],
					lengthSeconds: `${duration}`,
					isLiveContent: true,
					video_url: result,
					title: "sample",
				},
			} as unknown as videoInfo);

			const details = await getYouTubeVideo(new URL(url));
			expectValueEqual(details.url, result);
			expectDefined(details.duration.seconds);
			expectValueEqual(details.duration.seconds, duration);
		},
	);

	test("returns infinite duration for a livestream", async () => {
		// lofi hip hop radio - beats to relax/study to
		const url = "https://www.youtube.com/watch?v=jfKfPfyJRdk";
		mockGetBasicInfo.mockResolvedValue({
			videoDetails: {
				availableCountries: [
					/* ... */ "US" /* ... */, // truncated for testing purposes
				],
				lengthSeconds: "0",
				isLiveContent: true,
				video_url: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
				title: "lofi hip hop radio - beats to relax/study to",
			},
		} as unknown as videoInfo);

		const details = await getYouTubeVideo(new URL(url));
		expectValueEqual(details.url, url);
		expectDefined(details.duration.seconds);
		expectValueEqual(details.duration.seconds, Number.POSITIVE_INFINITY);
	});
});
