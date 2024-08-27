import type { EnvKey } from "../../src/helpers/environment.js";
import type { Message, PartialMessage } from "discord.js";
import { Client, GatewayIntentBits, Partials } from "discord.js";
import { useTestLogger } from "../testUtils/logger.js";
import { useDispatchLoop } from "./dispatchLoop.js";

export function requireEnv(key: EnvKey): string {
	const value = process.env[key];
	if (value === undefined) throw new TypeError(`${key} not found in environment variables.`);
	return value;
}

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

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.GuildMessageTyping,
	],
	partials: [Partials.Reaction, Partials.Channel, Partials.Message],
	allowedMentions: {
		parse: ["roles"],
		repliedUser: true,
		users: [requireEnv("BOT_TEST_ID")],
	},
});

client.on("messageCreate", useDispatchLoop(messageWaiters));
client.on("messageDelete", useDispatchLoop(messageDeleteWaiters));

const logger = useTestLogger();

async function signIn(): Promise<void> {
	logger.debug("Signing into test client...");
	const then = Date.now();
	await client.login(requireEnv("CORDE_TEST_TOKEN"));
	const now = Date.now();
	logger.verbose(`Login took ${now - then} ms.`);
}

// Preemptively start signing in
const signingIn = signIn();

export async function setupTesterClient(): Promise<void> {
	await signingIn;
	if (!client.isReady()) {
		// Another caller may have destroyed the client. Try again again
		await signIn();
	}
}

/**
 * Be sure to call this only in an `after` or `afterAll` hook.
 */
export function destroyTesterClient(): void {
	client.destroy();
	logger.debug("Signed out of test client");
}

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
	logger.debug("Waiting for tester client to sign in...");
	await setupTesterClient();

	logger.debug("Ensuring tester client is signed in...");
	if (!client.isReady()) throw new Error("Tester client is not ready");

	const then = Date.now();
	const result = await cb(client);
	const now = Date.now();
	logger.verbose(`Callback finished in ${now - then} ms.`);

	return result;
}
