import type { Command } from "./Command";
import { MessageEmbed } from "discord.js";
import { URL } from "url";
import {
	getYouTubeVideo,
	getOdyseeVideo,
	getSoundCloudTrack,
	getBandcampTrack
} from "../actions/getVideoDetails";

type FetchTestFunction = typeof getYouTubeVideo;

interface FetchTest {
	name: string;
	fn: FetchTestFunction;
	urlString: string;
}

interface FetchResult {
	test: FetchTest;
	endTime?: number;
	error?: NodeJS.ErrnoException;
}

const SERVICE_TESTS = [
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
		name: "Odysee",
		fn: getOdyseeVideo,
		// Jyc Row & WoodLore - Flamethrone Legacy (feat. Black Gryph0n & Michelle Creber) [2018 cover]
		urlString: "https://odysee.com/@Jyc_Row:1/jyc-row-woodlore-flamethrone-legacy-2:c"
	}
];

const SUCCESS = ":white_check_mark:";
const FAILURE = ":x:";

async function runTest(test: FetchTest): Promise<FetchResult> {
	const result: FetchResult = { test };
	try {
		await test.fn(new URL(test.urlString));
	} catch (error: unknown) {
		result.error = error as NodeJS.ErrnoException;
	} finally {
		result.endTime = Date.now();
	}

	return result;
}

function addResult(
	name: string,
	startTime: number,
	result: FetchResult,
	embed: MessageEmbed
): void {
	const runTime = (result.endTime ?? 0) - startTime;
	embed.addField(
		`${result.error ? FAILURE : SUCCESS} ${name} (${runTime}ms)`,
		result.error?.message ?? "Success!"
	);
}

let isTesting = false;

const type: Command = {
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
			const startTime = Date.now();

			// Ask for video info from our various services
			const results = await Promise.all(
				SERVICE_TESTS.map(runTest) //
			);

			// Prepare response
			const embed = new MessageEmbed();
			results.forEach(result => addResult(result.test.name, startTime, result, embed));

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
