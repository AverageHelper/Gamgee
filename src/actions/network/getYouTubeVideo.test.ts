import { expectDefined, expectValueEqual } from "../../../tests/testUtils/expectations/jest.js";
import { getYouTubeVideo } from "./getYouTubeVideo.js";
import { InvalidYouTubeUrlError, UnavailableError } from "../../errors/index.js";
import { URL } from "node:url";

describe("YouTube track details", () => {
	test.each`
		desc                                 | url                                                                            | error
		${"SoundCloud URL"}                  | ${"https://soundcloud.com/sparkeemusic/deadmau5-strobe-sparkee-nudisco-remix"} | ${InvalidYouTubeUrlError}
		${"unavailable video (9Y8ZGLiqXba)"} | ${"https://youtu.be/9Y8ZGLiqXba"}                                              | ${UnavailableError}
		${"unavailable video (dmneTS-Gows)"} | ${"https://www.youtube.com/watch?v=dmneTS-Gows"}                               | ${UnavailableError}
		${"too-short URL"}                   | ${"https://www.youtube.com/watch?v=9Y8ZGL"}                                    | ${InvalidYouTubeUrlError}
	`(
		"throws with $desc",
		async ({ url, error }: { url: string; error: Error }) => {
			await expect(() => getYouTubeVideo(new URL(url))).rejects.toThrow(error);
		},
		10000
	);

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
			const details = await getYouTubeVideo(new URL(url));
			expectValueEqual(details.url, result);
			expectDefined(details.duration.seconds);
			expectValueEqual(details.duration.seconds, duration);
		}
	);

	test("returns infinite duration for a livestream", async () => {
		// lofi hip hop radio - beats to relax/study to
		const url = "https://www.youtube.com/watch?v=jfKfPfyJRdk";
		const details = await getYouTubeVideo(new URL(url));
		expectValueEqual(details.url, url);
		expectDefined(details.duration.seconds);
		expectValueEqual(details.duration.seconds, Number.POSITIVE_INFINITY);
	});
});
