import Discord from "discord.js";
import defaultValueForConfigKey from "./constants/config/defaultValueForConfigKey";

jest.mock("./commands");
import { allCommands as mockCommandDefinitions } from "./commands";

import { handleCommand, optionsFromArgs } from "./handleCommand";
import { useTestLogger } from "../tests/testUtils/logger";

const logger = useTestLogger("error");

describe("Command handler", () => {
	const PREFIX = defaultValueForConfigKey("command_prefix") as string;
	const botId = "this-user";

	const mockReply = jest.fn().mockResolvedValue(undefined);
	const mockChannelSend = jest.fn().mockResolvedValue(undefined);
	const mockChannelStartTyping = jest.fn().mockResolvedValue(undefined);
	const mockChannelStopTyping = jest.fn().mockResolvedValue(undefined);

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
		client: (mockClient as unknown) as Discord.Client,
		reply: mockReply,
		channel: {
			send: mockChannelSend,
			startTyping: mockChannelStartTyping,
			stopTyping: mockChannelStopTyping
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
			expect(options).toBeInstanceOf(Discord.Collection);
			expect(options.size).toBe(0);
		});

		test("parses one option", () => {
			const url = "https://youtu.be/9Y8ZGLiqXB8";
			const options = optionsFromArgs([url]); // e.g: /video <url>
			expect(options).toBeInstanceOf(Discord.Collection);
			expect(options.size).toBe(1);
			expect(options.first()).toStrictEqual({
				name: url,
				type: "STRING",
				value: url,
				options: new Discord.Collection()
			});
		});

		test("parses two options as a parameter to a subcomand", () => {
			const subcommand = "get";
			const key = "cooldown";
			const options = optionsFromArgs([subcommand, key]); // e.g: /config get <key>
			expect(options).toBeInstanceOf(Discord.Collection);
			expect(options.size).toBe(1);
			expect(options.first()).toStrictEqual({
				name: subcommand,
				type: "SUB_COMMAND",
				value: subcommand,
				options: expect.any(Discord.Collection) as Discord.Collection<unknown, unknown>
			});
			expect(options.first()?.options).toBeDefined();
			expect(options.first()?.options?.size).toBe(1);
			expect(options.first()?.options?.keyArray()).toStrictEqual([key]);
			expect(options.first()?.options?.array()).toStrictEqual([
				{
					name: key,
					type: "STRING",
					value: key,
					options: new Discord.Collection()
				}
			]);
		});

		test("parses 3+ options as 2+ parameters to a subcommand", () => {
			const subcommand = "set";
			const key = "cooldown";
			const value = "null";
			const options = optionsFromArgs([subcommand, key, value]); // e.g: /config set <key> <value>
			expect(options).toBeInstanceOf(Discord.Collection);
			expect(options.size).toBe(1);
			expect(options.first()).toStrictEqual({
				name: subcommand,
				type: "SUB_COMMAND",
				value: subcommand,
				options: expect.any(Discord.Collection) as Discord.Collection<unknown, unknown>
			});
			expect(options.first()?.options).toBeDefined();
			expect(options.first()?.options?.size).toBe(2);
			expect(options.first()?.options?.keyArray()).toStrictEqual([key, value]);
			expect(options.first()?.options?.array()).toStrictEqual([
				{
					name: key,
					type: "STRING",
					value: key,
					options: new Discord.Collection()
				},
				{
					name: value,
					type: "STRING",
					value: value,
					options: new Discord.Collection()
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
			${`${prefix}test`}
			${`${prefix}blah`}
			${`\`${prefix}help\``}
			${`${prefix}helpp`}
			${`${prefix}srhttps://`}
		`(
			`does nothing with unknown command '${prefix}$content'`,
			async ({ content }: { content: string }) => {
				mockMessage.content = content;
				await handleCommand(mockClient, mockMessage, null, logger);

				mockCommandDefinitions.forEach(cmd => expect(cmd.execute).not.toHaveBeenCalled());
				expect.assertions(mockCommandDefinitions.size);
			}
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
			${"version"}
			${"video"}
		`("calls the $command command", async ({ command }: { command: string }) => {
			mockMessage.content = `${prefix}${command}`;
			mockMessage.author.bot = false;
			await handleCommand(mockClient, mockMessage, null, logger);

			const mock = mockCommandDefinitions.get(command)?.execute;
			expect(mock).toBeDefined();
			expect(mock).toHaveBeenCalledTimes(1);
			expect(mock).toHaveBeenCalledWith(
				expect.toContainEntries([
					["client", mockClient],
					["message", mockMessage],
					[
						"options",
						new Discord.Collection(
							command
								.split(/ +/u)
								.slice(1)
								.map(s => [s, s])
						)
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
			${"version"}
			${"video"}
		`(
			`ignores bot sending the command '${prefix}$command'`,
			async ({ command }: { command: string }) => {
				mockMessage.content = `${prefix}${command}`;
				mockMessage.author.bot = true;
				await handleCommand(mockClient, mockMessage, null, logger);

				mockCommandDefinitions.forEach(cmd => expect(cmd.execute).not.toHaveBeenCalled());
				expect.assertions(mockCommandDefinitions.size);
			}
		);
	});
});
