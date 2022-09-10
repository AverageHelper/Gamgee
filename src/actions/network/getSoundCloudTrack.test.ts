import { getSoundCloudTrack } from "./getSoundCloudTrack.js";
import { URL } from "node:url";

describe("SoundCloud track details", () => {
	const url = "https://soundcloud.com/hwps/no999";

	test.each`
		desc                  | url                                                                                                  | result                                                                         | duration
		${"is valid"}         | ${url}                                                                                               | ${url}                                                                         | ${95}
		${"has query params"} | ${"https://soundcloud.com/sparkeemusic/deadmau5-strobe-sparkee-nudisco-remix?ref=clipboard&p=i&c=0"} | ${"https://soundcloud.com/sparkeemusic/deadmau5-strobe-sparkee-nudisco-remix"} | ${219}
		${"has query params"} | ${"https://soundcloud.com/hollmusic/hol-x-afk-critical?si=5e39c7c7e7764f32b325c514cf19757e"}         | ${"https://soundcloud.com/hollmusic/hol-x-afk-critical"}                       | ${189}
	`(
		"returns info for a SoundCloud link that $desc, $duration seconds long",
		async ({ url, result, duration }: { url: string; result: string; duration: number }) => {
			const details = await getSoundCloudTrack(new URL(url));
			expect(details).toHaveProperty("url", result);
			expect(details?.duration.seconds).toBeDefined();
			expect(details?.duration.seconds).toBe(duration);
		},
		10000
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
			const details = await getSoundCloudTrack(new URL(url));
			expect(details).toHaveProperty("url", result);
			expect(details?.duration.seconds).toBePositive();
		},
		10000
	);

	test.each`
		platform        | url                                                            | duration
		${"Bandcamp"}   | ${"https://forestrainmedia.com/track/bad-wolf Text and stuff"} | ${277}
		${"Pony.fm"}    | ${"https://pony.fm/t46025 Text and stuff"}                     | ${385}
		${"SoundCloud"} | ${"https://soundcloud.com/hwps/no999 Text and stuff"}          | ${95}
		${"YouTube"}    | ${"https://youtu.be/9Y8ZGLiqXB8 Text and stuff"}               | ${346}
	`(
		"returns info for a $platform link that has extra info",
		async ({ url, duration }: { url: string; duration: number }) => {
			const { getVideoDetails } = await import("../getVideoDetails.js");

			const details = await getVideoDetails(url, null);
			// URL will be trimmed
			expect(details).not.toBeNil();
			expect(details?.duration.seconds).toBeDefined();
			expect(details?.duration.seconds).toBe(duration);
		},
		10000
	);
});
