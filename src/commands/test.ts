import type { Command } from "./Command.js";
import { MessageEmbed } from "discord.js";
import { URL } from "url";
import {
	getBandcampTrack,
	getPonyFmTrack,
	getSoundCloudTrack,
	getYouTubeVideo
} from "../actions/getVideoDetails.js";

type FetchTestFunction = typeof getYouTubeVideo;

interface FetchTest {
	name: string;
	fn: FetchTestFunction;
	urlString: string;
}

interface FetchResult {
	test: FetchTest;
	startTime: number;
	endTime?: number;
	error?: NodeJS.ErrnoException;
}

const SERVICE_TESTS: NonEmptyArray<FetchTest> = [
	{
		name: "YouTube",
		fn: getYouTubeVideo,
		// Nicolas Dominique - Pushing the Limits
		urlString: "https://youtu.be/jTCWupoPKIk"
	},
	{
		name: "SoundCloud",
		fn: getSoundCloudTrack,
		// nepo - No.999
		urlString: "https://soundcloud.com/hwps/no999"
	},
	{
		name: "Bandcamp",
		fn: getBandcampTrack,
		// WoodLore - Let The Magic Fill Your Soul
		urlString: "https://poniesatdawn.bandcamp.com/track/let-the-magic-fill-your-soul"
	},
	{
		name: "Pony.FM",
		fn: getPonyFmTrack,
		// https://pony.fm/tracks/5591-birdsong-ft-relative1pitch
		urlString: "https://pony.fm/tracks/5591-birdsong-ft-relative1pitch"
	}
];

const SUCCESS = ":white_check_mark:";
const FAILURE = ":x:";

async function runTest(test: FetchTest): Promise<FetchResult> {
	const startTime = Date.now();
	const result: FetchResult = { test, startTime };
	try {
		await test.fn(new URL(test.urlString));
	} catch (error: unknown) {
		result.error = error as NodeJS.ErrnoException;
	} finally {
		result.endTime = Date.now();
	}

	return result;
}

function addResult(result: FetchResult, embed: MessageEmbed): void {
	const name = result.test.name;
	const runTime = (result.endTime ?? 0) - result.startTime;
	embed.addField(
		name,
		`${result.error ? FAILURE : SUCCESS} ${result.error?.message ?? "Success"} (${runTime}ms)`
	);
}

let isTesting = false;

export const type: Command = {
	name: "test",
	description: "Make sure I still know how to talk to video services.",
	requiresGuild: false,
	async execute({ prepareForLongRunningTasks, replyPrivately }) {
		if (isTesting) {
			await replyPrivately("Hold up...");
			return;
		}
		isTesting = true;
		try {
			await prepareForLongRunningTasks(true);

			// Ask for video info from our various services
			const results = await Promise.all(
				SERVICE_TESTS.map(runTest) //
			);

			// Prepare response
			const embed = new MessageEmbed();
			// TODO: We use this URL in several places. Move it into a central place for us to import and use around
			const supportedPlatformsList =
				"https://github.com/AverageHelper/Gamgee#supported-music-platforms";
			embed.setTitle("Test Results");
			embed.setDescription(
				`See the [list of supported platforms](${supportedPlatformsList}) on our GitHub.`
			);
			results.forEach(result => addResult(result, embed));

			const anyFailures = results.some(result => result.error !== undefined);
			const content = anyFailures
				? ":sweat: Erm, something went wrong. Best look into this:"
				: "I ran the numbers, and it looks like we're all good! :grin:";

			await replyPrivately({ content, embeds: [embed], ephemeral: true });
		} finally {
			// eslint-disable-next-line require-atomic-updates
			isTesting = false;
		}
	}
};

export default type;
