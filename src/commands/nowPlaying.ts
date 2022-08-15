import type Discord from "discord.js";
import type { Command } from "./Command.js";
import { addUserToHaveCalledNowPlaying } from "../actions/queue/useQueue.js";
import { composed, createPartialString, push } from "../helpers/composeStrings.js";
import { fetchAllEntries } from "../useQueueStorage.js";
import { getQueueChannel } from "../actions/queue/getQueueChannel.js";
import { randomElementOfArray } from "../helpers/randomElementOfArray.js";

const uncertainties = [
	"There's a good chance",
	"I'm like 85% sure",
	"Very likely,",
	"I think",
	"The DJ told me"
];
let lastUncertainty: string | null = null;

function randomUncertainty(): string {
	let random = randomElementOfArray(uncertainties) ?? "";
	while (random === lastUncertainty) {
		random = randomElementOfArray(uncertainties) ?? "";
	}
	lastUncertainty = random;
	return random;
}

const current = [
	"it's",
	"they're playing",
	"you're hearing",
	"this is",
	"we're hearing",
	"they're playing"
];
let lastCurrent: string | null = null;

function randomCurrent(): string {
	let random = randomElementOfArray(current) ?? "";
	while (random === lastCurrent) {
		random = randomElementOfArray(current) ?? "";
	}
	lastCurrent = random;
	return random;
}

// TODO: i18n
export const nowPlaying: Command = {
	name: "now-playing",
	aliases: ["nowplaying"],
	description: "Reveal the current song in the queue (or my best guess).",
	requiresGuild: true,
	async execute({ guild, user, logger, replyPrivately, deleteInvocation }) {
		await deleteInvocation();

		const queueChannel: Discord.TextChannel | null = await getQueueChannel(guild);

		if (!queueChannel) {
			logger.debug("There is no queue channel for this guild.");
			return await replyPrivately("There's no queue set up right now, so nothing is playing.");
		}

		const allEntries = await fetchAllEntries(queueChannel);
		const firstNotDone = allEntries.find(entry => !entry.isDone);

		if (!firstNotDone) {
			logger.debug(`The song queue is currently empty.`);
			return await replyPrivately(
				"There's probably nothing playing right now. (If there is, I can't hear it)"
			);
		}

		logger.debug(`The oldest unplayed song is at ${firstNotDone.url}.`);

		await addUserToHaveCalledNowPlaying(
			user.id,
			await queueChannel.messages.fetch(firstNotDone.queueMessageId),
			queueChannel
		);

		const response = createPartialString();

		push(randomUncertainty(), response);
		push(" ", response);

		push(randomCurrent(), response);
		push(" ", response);

		push(`<@${firstNotDone.senderId}>'s submission: `, response);
		push(firstNotDone.url, response);
		// TODO: Also read out the song's title. Store this in the database as it comes in.

		return await replyPrivately(composed(response), true);
	}
};
