import type { Command } from "./Command";
import { getYouTubeVideo, getSoundCloudTrack, getBandcampTrack } from "../actions/getVideoDetails";
import { MessageEmbed } from "discord.js";
import { URL } from "url";

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
		urlString: "https://www.youtube.com/watch?v=9Y8ZGLiqXB8"
	},
	{
		name: "SoundCloud",
		fn: getSoundCloudTrack,
		urlString: "https://soundcloud.com/hwps/no999"
	},
	{
		name: "Bandcamp",
		fn: getBandcampTrack,
		urlString: "https://poniesatdawn.bandcamp.com/track/let-the-magic-fill-your-soul"
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

const type: Command = {
	name: "test",
	description: "Make sure I still know how to talk to video services.",
	requiresGuild: false,
	async execute({ prepareForLongRunningTasks, followUp }) {
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

		await followUp({ content, embeds: [embed], ephemeral: true });
	}
};

export default type;
