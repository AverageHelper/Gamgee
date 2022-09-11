import type Discord from "discord.js";
import { ApplicationCommandOptionType } from "discord.js";
import { DEFAULT_MESSAGE_COMMAND_PREFIX as PREFIX } from "./constants/database.js";

jest.mock("./helpers/githubMetadata.js");

import { gitHubMetadata } from "./helpers/githubMetadata.js";
const mockGitHubMetadata = gitHubMetadata as jest.Mock;
mockGitHubMetadata.mockResolvedValue({
	name: "Gamgee",
	full_name: "Gamgee",
	private: false,
	html_url: "https://example.com",
	description: "Gamgee",
	languages_url: "https://example.com",
	languages: {
		TypeScript: 100
	}
});

jest.mock("./commands");
import { allCommands as mockCommandDefinitions } from "./commands/index.js";

import { handleCommand, optionsFromArgs } from "./handleCommand.js";
import { useTestLogger } from "../tests/testUtils/logger.js";

const logger = useTestLogger();

describe("Command handler", () => {
	const botId = "this-user";

	const mockReply = jest.fn().mockResolvedValue(undefined);
	const mockAuthorSend = jest.fn().mockResolvedValue(undefined);
	const mockChannelSend = jest.fn().mockResolvedValue(undefined);
	const mockChannelSendTyping = jest.fn().mockResolvedValue(undefined);

	const mockClient: Discord.Client<true> = {
		user: { id: botId },
		isReady: () => true
	} as unknown as Discord.Client<true>;
	const mockSenderMember: Discord.GuildMember = {
		user: { id: "another-user" }
	} as unknown as Discord.GuildMember;

	const mockMessage: Discord.Message = {
		content: "",
		author: {
			bot: false,
			id: mockSenderMember.user.id,
			send: mockAuthorSend
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
	} as unknown as Discord.Message;

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
				type: ApplicationCommandOptionType.String,
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
				type: ApplicationCommandOptionType.Subcommand,
				value: subcommand,
				options: expect.toBeArrayOfSize(1) as Array<unknown>
			});
			expect(options[0]?.options).toBeDefined();
			expect(options[0]?.options).toStrictEqual([
				{
					name: key,
					type: ApplicationCommandOptionType.String,
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
				type: ApplicationCommandOptionType.Subcommand,
				value: subcommand,
				options: expect.toBeArrayOfSize(2) as Array<unknown>
			});
			expect(options[0]?.options).toBeDefined();
			expect(options[0]?.options).toStrictEqual([
				{
					name: key,
					type: ApplicationCommandOptionType.String,
					value: key,
					options: expect.toBeArrayOfSize(0) as Array<unknown>
				},
				{
					name: value,
					type: ApplicationCommandOptionType.String,
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
		describe("Option Constraints", () => {
			test("runs if option string is valid", async () => {
				const cmd = "setprefix"; // this command has length constraints on its first option
				const value = "";
				mockMessage.content = `${prefix}${cmd} ${value}`;
				await handleCommand(mockMessage, logger);

				const mock = mockCommandDefinitions.get(cmd)?.execute;
				expect(mock).toBeDefined();
				expect(mock).toHaveBeenCalledOnce();

				// Shouldn't reply privately to the user about the error that doesn't exist
				expect(mockAuthorSend).not.toHaveBeenCalled();
			});

			test.each`
				value     | desc
				${"long"} | ${"too long"}
			`("asserts option string is not $desc", async ({ value }: { value: string }) => {
				const cmd = "setprefix"; // this command has length constraints on its first option
				mockMessage.content = `${prefix}${cmd} ${value}`;
				await handleCommand(mockMessage, logger);

				const expectedMin = 1;
				const expectedMax = 3;
				const mock = mockCommandDefinitions.get(cmd)?.execute;
				expect(mock).toBeDefined();
				expect(mock).not.toHaveBeenCalled();

				// Should reply privately to the user about the error
				expect(mockAuthorSend).toHaveBeenCalledOnce();
				expect(mockAuthorSend).toHaveBeenCalledWith(
					expect.stringContaining(
						`Expected a string with a length between \`${expectedMin}\` and \`${expectedMax}\` but received one with a length of \`${value.length}\``
					)
				);
			});

			// eslint-disable-next-line jest/no-commented-out-tests
			/*
			test("runs if option integer is valid", async () => {
				const cmd = "limit"; // this command has range constraints on its second option
				const value = 5;
				mockMessage.content = `${prefix}${cmd} entry-duration ${value}`;
				await handleCommand(mockMessage, logger);

				const mock = mockCommandDefinitions.get(cmd)?.execute;
				expect(mock).toBeDefined();
				expect(mock).toHaveBeenCalledOnce();

				// Shouldn't reply privately to the user about the error that doesn't exist
				expect(mockAuthorSend).not.toHaveBeenCalled();

				// TODO: Option type and meta should have been transformed
			});

			test.each`
				value    | desc
				${"nan"} | ${"a string"}
				${3.01}  | ${"a floating-point value"}
				${-2}    | ${"just below limit"}
				${-10}   | ${"below limit"}
			`("asserts option integer is not $desc", async ({ value }: { value: number }) => {
				const cmd = "limit"; // this command has range constraints on its second option
				mockMessage.content = `${prefix}quo ${cmd} entry-duration ${value}`;
				await handleCommand(mockMessage, logger);

				const expectedMin = -1;
				const mock = mockCommandDefinitions.get(cmd)?.execute;
				expect(mock).toBeDefined();
				expect(mock).not.toHaveBeenCalled();

				// Should reply privately to the user about the error
				expect(mockAuthorSend).toHaveBeenCalledOnce();
				expect(mockAuthorSend).toHaveBeenCalledWith(
					expect.stringContaining(
						`Expected a string with a length between \`${expectedMin}\` but received one with a length of \`${value}\``
					)
				);
			});
			*/
		});

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
				await handleCommand(mockMessage, logger);

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
			${"setprefix"}
			${"help"}
			${"howto"}
			${"languages"}
			${"limits"}
			${"nowplaying"}
			${"now-playing"}
			${"ping"}
			${"quo"}
			${"sr"}
			${"t"}
			${"userinfo"}
			${"test"}
			${"version"}
			${"video"}
		`("calls the $command command", async ({ command }: { command: string }) => {
			mockMessage.content = `${prefix}${command}`;
			mockMessage.author.bot = false;
			await handleCommand(mockMessage, logger);

			const mock = mockCommandDefinitions.get(command.replace("-", ""))?.execute;
			expect(mock).toBeDefined();
			expect(mock).toHaveBeenCalledOnce();
			expect(mock).toHaveBeenCalledWith(
				expect.toContainEntries([
					["client", mockClient],
					["message", mockMessage],
					[
						"options",
						command
							.split(/ +/u)
							.slice(1)
							.map(name => ({ name, type: ApplicationCommandOptionType.String }))
					]
				])
			);
		});

		test.each`
			command
			${"setprefix"}
			${"help"}
			${"howto"}
			${"languages"}
			${"limits"}
			${"nowplaying"}
			${"now-playing"}
			${"ping"}
			${"quo"}
			${"sr"}
			${"t"}
			${"userinfo"}
			${"test"}
			${"version"}
			${"video"}
		`(
			`ignores bot sending the command '${prefix}$command'`,
			async ({ command }: { command: string }) => {
				mockMessage.content = `${prefix}${command}`;
				mockMessage.author.bot = true;
				await handleCommand(mockMessage, logger);

				mockCommandDefinitions.forEach(cmd => expect(cmd.execute).not.toHaveBeenCalled());
				expect.assertions(mockCommandDefinitions.size);
			}
		);

		test("Command alias `now-playing` calls command `nowplaying`", async () => {
			mockMessage.content = `${prefix}now-playing`;
			await handleCommand(mockMessage, logger);

			const mockNowPlaying = mockCommandDefinitions.get("nowplaying");
			expect(mockNowPlaying).toBeDefined();
			expect(mockNowPlaying?.execute).toHaveBeenCalledOnce();
		});
	});
});
