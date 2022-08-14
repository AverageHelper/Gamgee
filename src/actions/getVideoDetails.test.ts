import { getVideoDetails, getBandcampTrack } from "./getVideoDetails.js";
import { URL } from "node:url";
import { VideoError } from "../errors/VideoError.js";

describe("Video details", () => {
	// ** YouTube

	const testVid1 = "https://www.youtube.com/watch?v=9Y8ZGLiqXB8";

	test.each`
		desc                                 | url
		${"no input"}                        | ${""}
		${"invalid URL"}                     | ${"not at all"}
		${"unavailable video (9Y8ZGLiqXba)"} | ${"https://youtu.be/9Y8ZGLiqXba"}
		${"unavailable video (dmneTS-Gows)"} | ${"https://www.youtube.com/watch?v=dmneTS-Gows"}
		${"is too short"}                    | ${"https://www.youtube.com/watch?v=9Y8ZGL"}
	`(
		"returns null with $desc",
		async ({ url }: { url: string }) => {
			const details = await getVideoDetails(url, null);
			expect(details).toBeNull();
		},
		10000
	);

	test.each`
		desc                                      | url                                                                                                                    | result                                           | duration
		${"is already good"}                      | ${"https://youtube.com/watch?v=9RAQsdTQIcs"}                                                                           | ${"https://www.youtube.com/watch?v=9RAQsdTQIcs"} | ${174}
		${"is for mobile"}                        | ${"https://m.youtube.com/watch?v=9Y8ZGLiqXB8"}                                                                         | ${testVid1}                                      | ${346}
		${"is shortened"}                         | ${"https://youtu.be/9Y8ZGLiqXB8"}                                                                                      | ${testVid1}                                      | ${346}
		${"has extra info"}                       | ${"https://youtu.be/9Y8ZGLiqXB8 Text and stuff"}                                                                       | ${testVid1}                                      | ${346}
		${"spams repeat characters"}              | ${"https://youtu.be/9Y8ZGLiqXB8!!!!!!!!!!!!!!!!!!!!!!!!!!!!"}                                                          | ${testVid1}                                      | ${346}
		${"spams random characters"}              | ${"https://youtu.be/9Y8ZGLiqXB8kdasu997ru53"}                                                                          | ${testVid1}                                      | ${346}
		${"is a playlist"}                        | ${"https://www.youtube.com/watch?v=2rzoPFLRhqE&list=RDMM&start_radio=1&ab_channel=LucaStricagnoli"}                    | ${"https://www.youtube.com/watch?v=2rzoPFLRhqE"} | ${225}
		${"has channel info"}                     | ${"https://www.youtube.com/watch?v=nY1WVAoMnYc&ab_channel=JonathanYoung"}                                              | ${"https://www.youtube.com/watch?v=nY1WVAoMnYc"} | ${216}
		${"has time codes"}                       | ${"https://www.youtube.com/watch?v=NFw-FrYmAEw&t=10s"}                                                                 | ${"https://www.youtube.com/watch?v=NFw-FrYmAEw"} | ${1980}
		${"is shortened w/ unicode title"}        | ${"https://youtu.be/GgwUenaQqlM"}                                                                                      | ${"https://www.youtube.com/watch?v=GgwUenaQqlM"} | ${267}
		${"is a playlist entry w/ unicode title"} | ${"https://www.youtube.com/watch?v=GgwUenaQqlM&list=PLOKsOCrQbr0OCj6faA0kck1LwhQW-aj63&index=5"}                       | ${"https://www.youtube.com/watch?v=GgwUenaQqlM"} | ${267}
		${"has extra info w/ unicode title"}      | ${"https://www.youtube.com/watch?v=GgwUenaQqlM&ab_channel=TOHOanimation%E3%83%81%E3%83%A3%E3%83%B3%E3%83%8D%E3%83%AB"} | ${"https://www.youtube.com/watch?v=GgwUenaQqlM"} | ${267}
	`(
		"returns info for a YouTube link that $desc, $duration seconds long",
		async ({ url, result, duration }: { url: string; result: string; duration: number }) => {
			const details = await getVideoDetails(url, null);
			expect(details).toHaveProperty("url", result);
			expect(details?.duration.seconds).toBeDefined();
			expect(details?.duration.seconds).toBe(duration);
		}
	);

	test("returns infinite duration for a live stream", async () => {
		// lofi hip hop radio - beats to relax/study to
		const url = "https://www.youtube.com/watch?v=jfKfPfyJRdk";
		const details = await getVideoDetails(url, null);
		expect(details).toHaveProperty("url", url);
		expect(details?.duration.seconds).toBeDefined();
		expect(details?.duration.seconds).toBe(Number.POSITIVE_INFINITY);
	});

	// ** SoundCloud

	const testVid2 = "https://soundcloud.com/hwps/no999";

	test.each`
		desc                  | url                                                                                                  | result                                                                         | duration
		${"is valid"}         | ${testVid2}                                                                                          | ${testVid2}                                                                    | ${95}
		${"has extra info"}   | ${`${testVid2} Text and stuff`}                                                                      | ${testVid2}                                                                    | ${95}
		${"has query params"} | ${"https://soundcloud.com/sparkeemusic/deadmau5-strobe-sparkee-nudisco-remix?ref=clipboard&p=i&c=0"} | ${"https://soundcloud.com/sparkeemusic/deadmau5-strobe-sparkee-nudisco-remix"} | ${219}
		${"has query params"} | ${"https://soundcloud.com/hollmusic/hol-x-afk-critical?si=5e39c7c7e7764f32b325c514cf19757e"}         | ${"https://soundcloud.com/hollmusic/hol-x-afk-critical"}                       | ${189}
	`(
		"returns info for a SoundCloud link that $desc, $duration seconds long",
		async ({ url, result, duration }: { url: string; result: string; duration: number }) => {
			const details = await getVideoDetails(url, null);
			expect(details).toHaveProperty("url", result);
			expect(details?.duration.seconds).toBeDefined();
			expect(details?.duration.seconds).toBe(duration);
		}
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
			const details = await getVideoDetails(url, null);
			expect(details).toHaveProperty("url", result);
			expect(details?.duration.seconds).toBePositive();
		}
	);

	// ** BandCamp

	test("returns null for bandcamp album links", async () => {
		const url = "https://poniesatdawn.bandcamp.com/album/memories";
		// TODO: We should mock getBandcampTrack and check that getVideoDetails called it
		const details = await getVideoDetails(url, null);
		expect(details).toBe(null);
	});

	test("throws specifically for bandcamp album links", async () => {
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
			// TODO: We should mock getBandcampTrack and check that getVideoDetails called it
			const details = await getVideoDetails(url, null);
			expect(details).toHaveProperty("url", url);
			expect(details?.duration.seconds).toBeDefined();
			expect(details?.duration.seconds).toBe(duration);
		}
	);

	test.each`
		url                                                                             | duration
		${"https://poniesatdawn.bandcamp.com/track/let-the-magic-fill-your-soul"}       | ${233}
		${"https://forestrainmedia.com/track/bad-wolf"}                                 | ${277}
		${"https://lehtmojoe.bandcamp.com/track/were-not-going-home-dallas-stars-2020"} | ${170}
	`(
		"returns info specifically for Bandcamp track $url, $duration seconds long",
		async ({ url, duration }: { url: string; duration: number }) => {
			const details = await getBandcampTrack(new URL(url));
			expect(details).toHaveProperty("url", url);
			expect(details?.duration.seconds).toBeDefined();
			expect(details?.duration.seconds).toBe(duration);
		}
	);

	// ** Pony.fm

	test.each`
		desc                         | url
		${"album link"}              | ${"https://pony.fm/albums/4761-heroes-the-label-compilation"}
		${"artist page"}             | ${"https://pony.fm/skyshard"}
		${"playlist"}                | ${"https://pony.fm/playlist/566-all-violin-melodys-original-mixes-remixes"}
		${"about page"}              | ${"https://pony.fm/about"}
		${"tracks page"}             | ${"https://pony.fm/tracks/"}
		${"invalid track"}           | ${"https://pony.fm/tracks/54321"}
		${"invalid track shortlink"} | ${"https://pony.fm/t54321"}
	`("returns null with Pony.fm $desc", async ({ url }: { desc: string; url: string }) => {
		const details = await getVideoDetails(url, null);
		expect(details).toBe(null);
	});

	test.each`
		desc                      | url
		${"long link"}            | ${"https://pony.fm/tracks/46025-beneath-the-sea-ft-lectro-dub-studio-quinn-liv-learn-zelizine"}
		${"incomplete long link"} | ${"https://pony.fm/tracks/46025-beneath-the-sea-ft-"}
		${"short link"}           | ${"https://pony.fm/t46025"}
	`(
		"returns correct length for $desc of Pony.fm track",
		async ({ url }: { desc: string; url: string }) => {
			const details = await getVideoDetails(url, null);
			expect(details).toHaveProperty(
				"url",
				"https://pony.fm/tracks/46025-beneath-the-sea-ft-lectro-dub-studio-quinn-liv-learn-zelizine"
			);
			expect(details?.duration.seconds).toBeDefined();
			expect(details?.duration.seconds).toBe(385);
		}
	);
});
