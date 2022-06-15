import Discord from "discord.js";
import { requireEnv } from "../../src/helpers/environment.js";
import { timeoutSeconds } from "../../src/helpers/timeoutSeconds.js";
import { useDispatchLoop } from "./dispatchLoop.js";

let isClientLoggedIn = false;
const client = new Discord.Client({
	intents: [
		"GUILDS",
		"GUILD_MESSAGES",
		"GUILD_MESSAGE_REACTIONS",
		"DIRECT_MESSAGES",
		"GUILD_MESSAGE_TYPING"
	]
});

/**
 * A collection of functions that expect a message to arrive within a
 * predefined timeout. When a message arrives in any channel accessible
 * by the tester bot, all of these functions are called. Those that
 * return `true` will be removed from the collection.
 *
 * Waiter functions should remove themselves from this collection if their
 * timeout elapses before a matching message arrives.
 */
export const messageWaiters = new Discord.Collection<number, (msg: Discord.Message) => boolean>();

client.on("messageCreate", useDispatchLoop(messageWaiters));

/**
 * A collection of functions that expect a message be deleted within a
 * predefined timeout. When a message arrives in any channel accessible
 * by the tester bot, all of these functions are called. Those that
 * return `true` will be removed from the collection.
 *
 * Waiter functions should remove themselves from this collection if their
 * timeout elapses before a matching message arrives.
 */
export const messageDeleteWaiters = new Discord.Collection<
	number,
	(msg: Discord.Message | Discord.PartialMessage) => boolean
>();

client.on("messageDelete", useDispatchLoop(messageDeleteWaiters));

/**
 * Prepares the tester bot's Discord client. If the client is not logged in,
 * then we log it in before we return.
 *
 * @returns the logged-in Discord client for the tester bot.
 */
export async function testerClient(): Promise<Discord.Client> {
	const TESTER_TOKEN = requireEnv("CORDE_TEST_TOKEN");
	if (!isClientLoggedIn) {
		isClientLoggedIn = true;
		await client.login(TESTER_TOKEN);
	}
	return client;
}

/**
 * Logs out of the tester bot's Discord client.
 */
export async function logOut(): Promise<void> {
	if (isClientLoggedIn) {
		client.destroy();
		await timeoutSeconds(1); // die after 1s
	}
}
