import type { GuildedCommand } from "./Command.js";
import type { TextChannel } from "discord.js";
import { addUserToHaveCalledNowPlaying } from "../actions/queue/useQueue.js";
import { getAllStoredEntries } from "../useQueueStorage.js";
import { getQueueChannel } from "../actions/queue/getQueueChannel.js";
import { localizations, t, ti } from "../i18n.js";
import { randomElementOfArray } from "../helpers/randomElementOfArray.js";
import { userMention } from "discord.js";

const responses = [
	"commands.nowplaying.responses.almost-sure",
	"commands.nowplaying.responses.dj-says",
	"commands.nowplaying.responses.good-chance",
	"commands.nowplaying.responses.i-think",
	"commands.nowplaying.responses.likely"
] as const;
let lastResponse: Response | null = null;

type Response = GetArrayElementType<typeof responses>;

function randomResponse(): Response {
	let random = randomElementOfArray(responses) ?? "";
	while (random === lastResponse) {
		random = randomElementOfArray(responses) ?? "";
	}
	lastResponse = random;
	return random;
}

export const nowPlaying: GuildedCommand = {
	name: "nowplaying",
	nameLocalizations: localizations("commands.nowplaying.name"),
	aliases: ["now-playing"],
	description: "Reveal the current song in the queue (or my best guess).",
	descriptionLocalizations: localizations("commands.nowplaying.description"),
	requiresGuild: true,
	async execute({ guild, user, userLocale, logger, replyPrivately, deleteInvocation }) {
		await deleteInvocation();

		const queueChannel: TextChannel | null = await getQueueChannel(guild);

		if (!queueChannel) {
			logger.debug("There is no queue channel for this guild.");
			return await replyPrivately(t("commands.nowplaying.responses.no-queue", userLocale));
		}

		const allEntries = await getAllStoredEntries(queueChannel);
		const firstNotDone = allEntries.find(entry => !entry.isDone);

		if (!firstNotDone) {
			logger.debug(`The song queue is currently empty.`);
			return await replyPrivately(t("commands.nowplaying.responses.no-song", userLocale));
		}

		logger.debug(`The oldest unplayed song is at ${firstNotDone.url}.`);

		await addUserToHaveCalledNowPlaying(
			user.id,
			await queueChannel.messages.fetch(firstNotDone.queueMessageId),
			queueChannel
		);

		const usermention = userMention(firstNotDone.senderId);
		const url = firstNotDone.url;
		const response = ti(randomResponse(), { usermention, url }, userLocale);

		// TODO: Also read out the song's title. Store this in the database as it comes in.

		return await replyPrivately(response, true);
	}
};
