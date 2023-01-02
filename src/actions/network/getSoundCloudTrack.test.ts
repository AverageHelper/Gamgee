import { getSoundCloudTrack } from "./getSoundCloudTrack.js";
import { URL } from "node:url";
import {
	expectDefined,
	expectPositive,
	expectValueEqual
} from "../../../tests/testUtils/expectations/jest.js";

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
			expectValueEqual(details.url, result);
			expectDefined(details.duration.seconds);
			expectValueEqual(details.duration.seconds, duration);
		},
		20000
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
			expectValueEqual(details.url, result);
			expectPositive(details.duration.seconds);
		},
		20000
	);
});
