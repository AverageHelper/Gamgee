import type { Message, PartialMessage } from "discord.js";
import { Client, GatewayIntentBits, Partials } from "discord.js";
import { requireEnv } from "../../src/helpers/environment.js";
import { useDispatchLoop } from "./dispatchLoop.js";

/**
 * A collection of functions that expect a message to arrive within a
 * predefined timeout. When a message arrives in any channel accessible
 * by the tester bot, all of these functions are called. Those that
 * return `true` will be removed from the collection.
 *
 * Waiter functions should remove themselves from this collection if their
 * timeout elapses before a matching message arrives.
 */
export const messageWaiters = new Map<number, (msg: Message) => boolean>();

/**
 * A collection of functions that expect a message be deleted within a
 * predefined timeout. When a message arrives in any channel accessible
 * by the tester bot, all of these functions are called. Those that
 * return `true` will be removed from the collection.
 *
 * Waiter functions should remove themselves from this collection if their
 * timeout elapses before a matching message arrives.
 */
export const messageDeleteWaiters = new Map<number, (msg: Message | PartialMessage) => boolean>();

/**
 * Prepares the tester bot's Discord client. If the client is not logged in,
 * then we log it in before we return.
 *
 * @param cb A callback function that receives a logged-in Discord
 * client. After the function resolves or throws, the client automatically
 * logs out.
 *
 * @returns the logged-in Discord client for the tester bot.
 */
export async function useTesterClient<T>(cb: (client: Client<true>) => Promise<T>): Promise<T> {
	const client = new Client({
		intents: [
			GatewayIntentBits.Guilds,
			GatewayIntentBits.GuildMessages,
			GatewayIntentBits.MessageContent,
			GatewayIntentBits.GuildMessageReactions,
			GatewayIntentBits.DirectMessages,
			GatewayIntentBits.GuildMessageTyping
		],
		partials: [Partials.Reaction, Partials.Channel, Partials.Message],
		allowedMentions: {
			parse: ["roles", "users"],
			repliedUser: true,
			users: [requireEnv("BOT_TEST_ID")]
		}
	});

	const result = new Promise<T>((resolve, reject) => {
		client.on("ready", async client => {
			client.on("messageCreate", useDispatchLoop(messageWaiters));
			client.on("messageDelete", useDispatchLoop(messageDeleteWaiters));

			try {
				const result = await cb(client);
				client.destroy();
				return resolve(result);
			} catch (error) {
				client.destroy();
				return reject(error);
			}
		});
	});

	await client.login(requireEnv("CORDE_TEST_TOKEN"));

	return await result;
}
