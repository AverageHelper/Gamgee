import type Discord from "discord.js";
import { defaultValueForConfigKey } from "./constants/config/defaultValueForConfigKey.js";

jest.mock("./commands");
import { allCommands as mockCommandDefinitions } from "./commands/index.js";

import { handleCommand, optionsFromArgs } from "./handleCommand.js";
import { useTestLogger } from "../tests/testUtils/logger.js";

const logger = useTestLogger("error");

describe("Command handler", () => {
	const PREFIX = defaultValueForConfigKey("command_prefix") as string;
	const botId = "this-user";

	const mockReply = jest.fn().mockResolvedValue(undefined);
	const mockChannelSend = jest.fn().mockResolvedValue(undefined);
	const mockChannelSendTyping = jest.fn().mockResolvedValue(undefined);

	const mockClient: Discord.Client = ({ user: { id: botId } } as unknown) as Discord.Client;
	const mockSenderMember: Discord.GuildMember = ({
		user: { id: "another-user" }
	} as unknown) as Discord.GuildMember;

	const mockMessage: Discord.Message = ({
		content: "",
		author: {
			bot: false,
			id: mockSenderMember.user.id
		},
		client: mockClient,
		reply: mockReply,
		channel: {
			send: mockChannelSend,
			sendTyping: mockChannelSendTyping
		},
		guild: {
			members: {
				fetch: jest.fn().mockImplementation(
					(userId: string) =>
						new Promise(resolve => {
							if (userId === mockSenderMember.user.id) {
								return resolve(mockSenderMember);
							} else if (userId === botId) {
								return resolve(mockClient);
							}
							return resolve(mockSenderMember);
						})
				)
			}
		}
	} as unknown) as Discord.Message;

	beforeEach(() => {
		mockMessage.content = "Some words";
		mockMessage.author.bot = false;
		jest.clearAllMocks();
	});

	describe("Options Parser", () => {
		test("parses empty options from a root command", () => {
			const options = optionsFromArgs([]); // e.g: /help
			expect(options).toBeArrayOfSize(0);
		});

		test("parses one option", () => {
			const url = "https://youtu.be/9Y8ZGLiqXB8";
			const options = optionsFromArgs([url]); // e.g: /video <url>
			expect(options).toBeArrayOfSize(1);
			expect(options[0]).toStrictEqual({
				name: url,
				type: "STRING",
				value: url,
				options: []
			});
		});

		test("parses two options as a parameter to a subcomand", () => {
			const subcommand = "get";
			const key = "cooldown";
			const options = optionsFromArgs([subcommand, key]); // e.g: /config get <key>
			expect(options).toBeArrayOfSize(1);
			expect(options[0]).toStrictEqual({
				name: subcommand,
				type: "SUB_COMMAND",
				value: subcommand,
				options: expect.toBeArrayOfSize(1) as Array<unknown>
			});
			expect(options[0]?.options).toBeDefined();
			expect(options[0]?.options).toStrictEqual([
				{
					name: key,
					type: "STRING",
					value: key,
					options: []
				}
			]);
		});

		test("parses 3+ options as 2+ parameters to a subcommand", () => {
			const subcommand = "set";
			const key = "cooldown";
			const value = "null";
			const options = optionsFromArgs([subcommand, key, value]); // e.g: /config set <key> <value>
			expect(options).toBeArrayOfSize(1);
			expect(options[0]).toStrictEqual({
				name: subcommand,
				type: "SUB_COMMAND",
				value: subcommand,
				options: expect.toBeArrayOfSize(2) as Array<unknown>
			});
			expect(options[0]?.options).toBeDefined();
			expect(options[0]?.options).toStrictEqual([
				{
					name: key,
					type: "STRING",
					value: key,
					options: expect.toBeArrayOfSize(0) as Array<unknown>
				},
				{
					name: value,
					type: "STRING",
					value: value,
					options: expect.toBeArrayOfSize(0) as Array<unknown>
				}
			]);
		});
	});

	describe.each`
		prefix             | desc
		${PREFIX}          | ${"command prefix"}
		${`<@${botId}> `}  | ${"username-mention"}
		${`<@!${botId}> `} | ${"nickname-mention"}
	`("using $desc", ({ prefix }: { prefix: string }) => {
		test.each`
			content
			${"Some words"}
			${prefix}
			${`${prefix}?`}
			${`${prefix}tesst`}
			${`${prefix}blah`}
			${`\`${prefix}help\``}
			${`${prefix}helpp`}
			${`${prefix}srhttps://`}
		`(
			`does nothing with unknown command '${prefix}$content'`,
			async ({ content }: { content: string }) => {
				mockMessage.content = content;
				await handleCommand(mockMessage, null, logger);

				mockCommandDefinitions.forEach(cmd => expect(cmd.execute).not.toHaveBeenCalled());
				// FIXME: Not sure why, but these three lines hold up the world. Without them, nothing or everything will break. Nobody knows. Schrödinger's cat got nothing on this:
				await new Promise(resolve => setTimeout(resolve, 20));
				if (mockCommandDefinitions.size > 13)
					logger.debug("mockCommandDefinitions", mockCommandDefinitions);
				expect.assertions(mockCommandDefinitions.size);
			},
			10000
		);

		test.each`
			command
			${"config"}
			${"help"}
			${"howto"}
			${"languages"}
			${"limits"}
			${"now-playing"}
			${"ping"}
			${"quo"}
			${"sr"}
			${"t"}
			${"test"}
			${"version"}
			${"video"}
		`("calls the $command command", async ({ command }: { command: string }) => {
			mockMessage.content = `${prefix}${command}`;
			mockMessage.author.bot = false;
			await handleCommand(mockMessage, null, logger);

			const mock = mockCommandDefinitions.get(command)?.execute;
			expect(mock).toBeDefined();
			expect(mock).toHaveBeenCalledTimes(1);
			expect(mock).toHaveBeenCalledWith(
				expect.toContainEntries([
					["client", mockClient],
					["message", mockMessage],
					[
						"options",
						command
							.split(/ +/u)
							.slice(1)
							.map(s => ({ name: s, type: "STRING" }))
					],
					["storage", null]
				])
			);
		});

		test.each`
			command
			${"config"}
			${"help"}
			${"howto"}
			${"languages"}
			${"limits"}
			${"now-playing"}
			${"ping"}
			${"quo"}
			${"sr"}
			${"t"}
			${"test"}
			${"version"}
			${"video"}
		`(
			`ignores bot sending the command '${prefix}$command'`,
			async ({ command }: { command: string }) => {
				mockMessage.content = `${prefix}${command}`;
				mockMessage.author.bot = true;
				await handleCommand(mockMessage, null, logger);

				mockCommandDefinitions.forEach(cmd => expect(cmd.execute).not.toHaveBeenCalled());
				expect.assertions(mockCommandDefinitions.size);
			}
		);

		test("Command alias `nowplaying` calls command `now-playing`", async () => {
			mockMessage.content = `${prefix}nowplaying`;
			await handleCommand(mockMessage, null, logger);

			const mockNowPlaying = mockCommandDefinitions.get("now-playing");
			expect(mockNowPlaying).toBeDefined();
			expect(mockNowPlaying?.execute).toHaveBeenCalledTimes(1);
		});
	});
});
