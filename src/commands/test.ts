import type { Command } from "./Command.js";
import type { VideoMetaSource } from "../actions/getVideoDetails.js";
import { code } from "../helpers/composeStrings.js";
import { EmbedBuilder } from "discord.js";
import { getBandcampTrack } from "../actions/network/getBandcampTrack.js";
import { getPonyFmTrack } from "../actions/network/getPonyFmTrack.js";
import { getSoundCloudTrack } from "../actions/network/getSoundCloudTrack.js";
import { getYouTubeVideo } from "../actions/network/getYouTubeVideo.js";
import { localizations, t, ti } from "../i18n.js";
import { supportedPlatformsList } from "../constants/repository.js";
import { version } from "../version.js";

type FetchTestFunction = typeof getYouTubeVideo;

interface FetchTest {
	readonly name: string;
	readonly fn: FetchTestFunction;
	readonly urlString: string;
}

interface FetchResult {
	test: FetchTest;
	startTime: number;
	endTime?: number;
	error?: NodeJS.ErrnoException;
	metaSource?: VideoMetaSource;
}

const SERVICE_TESTS: Readonly<NonEmptyArray<FetchTest>> = [
	{
		name: "YouTube",
		fn: getYouTubeVideo,
		// Nicolas Dominique - Pushing the Limits
		urlString: "https://youtu.be/jTCWupoPKIk",
	},
	{
		name: "SoundCloud",
		fn: getSoundCloudTrack,
		// nepo - No.999
		urlString: "https://soundcloud.com/hwps/no999",
	},
	{
		name: "Bandcamp",
		fn: getBandcampTrack,
		// WoodLore - Let The Magic Fill Your Soul
		urlString: "https://poniesatdawn.bandcamp.com/track/let-the-magic-fill-your-soul",
	},
	{
		name: "Pony.FM",
		fn: getPonyFmTrack,
		// https://pony.fm/tracks/5591-birdsong-ft-relative1pitch
		urlString: "https://pony.fm/tracks/5591-birdsong-ft-relative1pitch",
	},
];

const SUCCESS = ":white_check_mark:";
const FAILURE = ":x:";

async function runTest(test: FetchTest): Promise<FetchResult> {
	const startTime = Date.now();
	const result: FetchResult = { test, startTime };
	try {
		const info = await test.fn(new URL(test.urlString));
		result.metaSource = info.metaSource;
	} catch (error) {
		result.error = error as NodeJS.ErrnoException;
	} finally {
		result.endTime = Date.now();
	}

	return result;
}

function addResult(result: FetchResult, embed: EmbedBuilder): void {
	const name = result.test.name;
	const runTime = (result.endTime ?? 0) - result.startTime;
	const alt = result.metaSource?.alternative ?? null;
	const via = alt === null ? "" : ` (via ${code(alt)})`;
	embed.addFields({
		name: `${name}${via}`,
		value: `${result.error ? FAILURE : SUCCESS} ${
			result.error?.message ?? "Success"
		} (${runTime}ms)`,
	});
}

let isTesting = false;

export const test: Command = {
	name: "test",
	nameLocalizations: localizations("commands.test.name"),
	description: "Make sure I still know how to talk to video services.",
	descriptionLocalizations: localizations("commands.test.description"),
	requiresGuild: false,
	async execute({ userLocale, prepareForLongRunningTasks, replyPrivately }) {
		if (isTesting) {
			// TODO: Scope this to the user, instead of globally
			await replyPrivately(
				t("commands.test.responses.cannot-run-concurrent-invocations", userLocale),
			);
			return;
		}
		isTesting = true;
		try {
			await prepareForLongRunningTasks(true);

			// Ask for video info from our various services
			const results = await Promise.all(
				SERVICE_TESTS.map(runTest), //
			);

			// Prepare response
			const embed = new EmbedBuilder();
			embed.setFooter({ text: `Gamgee v${version}` });

			const list = `[${t(
				"commands.test.responses.supported-platforms",
				userLocale,
			)}](${supportedPlatformsList})`;

			embed.setTitle(t("commands.test.responses.results-header", userLocale));
			embed.setDescription(ti("commands.test.responses.see-on-forge", { list }, userLocale));
			for (const result of results) {
				addResult(result, embed);
			}

			const anyFailures = results.some(result => result.error !== undefined);
			const content = anyFailures
				? `:sweat: ${t("commands.test.responses.preamble-failure", userLocale)}`
				: `${t("commands.test.responses.preamble-success", userLocale)} :grin:`;

			await replyPrivately({ content, embeds: [embed] });
		} finally {
			// eslint-disable-next-line require-atomic-updates
			isTesting = false;
		}
	},
};
