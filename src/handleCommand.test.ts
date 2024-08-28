import type { Client, GuildMember, Message, UserResolvable } from "discord.js";
import type { Mock } from "vitest";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { ApplicationCommandOptionType, userMention } from "discord.js";
import { expectArrayOfLength, expectDefined } from "../tests/testUtils/expectations.js";
import { DEFAULT_MESSAGE_COMMAND_PREFIX as PREFIX } from "./constants/database.js";

vi.mock("./helpers/gitForgeMetadata.js");

import { gitForgeMetadata } from "./helpers/gitForgeMetadata.js";
const mockGitForgeMetadata = gitForgeMetadata as Mock<typeof gitForgeMetadata>;
mockGitForgeMetadata.mockResolvedValue({
	name: "Gamgee",
	full_name: "Gamgee",
	private: false,
	html_url: "https://example.com",
	description: "Gamgee",
	languages_url: "https://example.com",
	languages: {
		TypeScript: 100,
	},
});

vi.mock("./commands/index.js");
import { allCommands as mockCommandDefinitions } from "./commands/index.js";

import { handleCommand, optionsFromArgs } from "./handleCommand.js";
import { useTestLogger } from "../tests/testUtils/logger.js";

const logger = useTestLogger();

describe("Command handler", () => {
	const botId = "this-user";

	/* eslint-disable @typescript-eslint/consistent-type-assertions */
	const mockReply = vi.fn<Message["reply"]>().mockResolvedValue({} as Message);
	const mockAuthorSend = vi.fn<Message["author"]["send"]>().mockResolvedValue({} as Message<false>);
	const mockChannelSend = vi
		.fn<Message["channel"]["send"]>()
		.mockResolvedValue({} as Message<true>);
	const mockChannelSendTyping = vi
		.fn<Message["channel"]["sendTyping"]>()
		.mockResolvedValue(undefined);
	/* eslint-enable @typescript-eslint/consistent-type-assertions */

	const mockClient: Client<true> = {
		user: { id: botId },
		isReady: () => true,
	} as unknown as Client<true>;
	const mockSenderMember: GuildMember = {
		user: { id: "another-user" },
	} as unknown as GuildMember;

	const mockMessage: Message = {
		content: "",
		author: {
			bot: false,
			id: mockSenderMember.user.id,
			send: mockAuthorSend,
		},
		client: mockClient,
		reply: mockReply,
		channel: {
			send: mockChannelSend,
			sendTyping: mockChannelSendTyping,
		},
		guild: {
			members: {
				fetch: vi.fn<(u: UserResolvable) => Promise<GuildMember>>().mockImplementation(
					userId =>
						new Promise(resolve => {
							if (userId === mockSenderMember.user.id) {
								return resolve(mockSenderMember);
							}
							return resolve(mockSenderMember);
						}),
				),
			},
		},
	} as unknown as Message;

	beforeEach(() => {
		mockMessage.content = "Some words";
		mockMessage.author.bot = false;
		vi.clearAllMocks();
	});

	describe("Options Parser", () => {
		test("parses empty options from a root command", () => {
			const options = optionsFromArgs([]); // e.g: /help
			expectArrayOfLength(options, 0);
		});

		test("parses one option", () => {
			const url = "https://youtu.be/9Y8ZGLiqXB8";
			const options = optionsFromArgs([url]); // e.g: /video <url>
			expectArrayOfLength(options, 1);
			expect(options[0]).toStrictEqual({
				name: url,
				type: ApplicationCommandOptionType.String,
				value: url,
				options: [],
			});
		});

		test("parses two options as a parameter to a subcomand", () => {
			const subcommand = "get";
			const key = "cooldown";
			const options = optionsFromArgs([subcommand, key]); // e.g: /config get <key>
			expectArrayOfLength(options, 1);
			expect(options[0]).toStrictEqual({
				name: subcommand,
				type: ApplicationCommandOptionType.Subcommand,
				value: subcommand,
				options: expect.arrayContaining([]) as Array<unknown>,
			});
			expectDefined(options[0]?.options);
			expect(options[0].options).toStrictEqual([
				{
					name: key,
					type: ApplicationCommandOptionType.String,
					value: key,
					options: [],
				},
			]);
		});

		test("parses 3+ options as 2+ parameters to a subcommand", () => {
			const subcommand = "set";
			const key = "cooldown";
			const value = "null";
			const options = optionsFromArgs([subcommand, key, value]); // e.g: /config set <key> <value>
			expectArrayOfLength(options, 1);
			expect(options[0]).toStrictEqual({
				name: subcommand,
				type: ApplicationCommandOptionType.Subcommand,
				value: subcommand,
				options: expect.arrayContaining([]) as Array<unknown>,
			});
			expectDefined(options[0].options);
			expect(options[0].options).toStrictEqual([
				{
					name: key,
					type: ApplicationCommandOptionType.String,
					value: key,
					options: expect.arrayContaining([]) as Array<unknown>,
				},
				{
					name: value,
					type: ApplicationCommandOptionType.String,
					value: value,
					options: expect.arrayContaining([]) as Array<unknown>,
				},
			]);
			expect(options[0].options[0]?.options).toHaveLength(0);
			expect(options[0].options[1]?.options).toHaveLength(0);
		});
	});

	describe.each`
		prefix                      | desc
		${PREFIX}                   | ${"command prefix"}
		${`${userMention(botId)} `} | ${"username-mention"}
		${`<@!${botId}> `}          | ${"nickname-mention"}
	`("using $desc", ({ prefix }: { prefix: string }) => {
		describe("Option Constraints", () => {
			test("runs if option string is valid", async () => {
				const cmd = "setprefix"; // this command has length constraints on its first option
				const value = "";
				mockMessage.content = `${prefix}${cmd} ${value}`;
				await handleCommand(mockMessage, logger);

				const mock = mockCommandDefinitions.get(cmd)?.execute;
				expectDefined(mock);
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
				expectDefined(mock);
				expect(mock).not.toHaveBeenCalled();

				// Should reply privately to the user about the error
				expect(mockAuthorSend).toHaveBeenCalledOnce();
				expect(mockAuthorSend).toHaveBeenCalledWith(
					expect.stringContaining(
						`Expected a string with a length between \`${expectedMin}\` and \`${expectedMax}\` but received one with a length of \`${value.length}\``,
					),
				);
			});

			// eslint-disable-next-line vitest/no-commented-out-tests
			/*
			test("runs if option integer is valid", async () => {
				const cmd = "limit"; // this command has range constraints on its second option
				const value = 5;
				mockMessage.content = `${prefix}${cmd} entry-duration-max ${value}`;
				await handleCommand(mockMessage, logger);

				const mock = mockCommandDefinitions.get(cmd)?.execute;
				expectDefined(mock);
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
				mockMessage.content = `${prefix}quo ${cmd} entry-duration-max ${value}`;
				await handleCommand(mockMessage, logger);

				const expectedMin = -1;
				const mock = mockCommandDefinitions.get(cmd)?.execute;
				expectDefined(mock);
				expect(mock).not.toHaveBeenCalled();

				// Should reply privately to the user about the error
				expect(mockAuthorSend).toHaveBeenCalledOnce();
				expect(mockAuthorSend).toHaveBeenCalledWith(
					expect.stringContaining(
						`Expected a string with a length between \`${expectedMin}\` but received one with a length of \`${value}\``,
					),
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

				for (const cmd of mockCommandDefinitions.values()) {
					expect(cmd.execute).not.toHaveBeenCalled();
				}
				// FIXME: Not sure why, but these three lines hold up the world. Without them, nothing or everything will break. Nobody knows. Schrödinger's cat got nothing on this:
				await new Promise(resolve => setTimeout(resolve, 20));
				if (mockCommandDefinitions.size > 13)
					logger.debug("mockCommandDefinitions", mockCommandDefinitions);
				expect.assertions(mockCommandDefinitions.size);
			},
			20000,
		);

		test.each`
			command
			${"setprefix"}
			${"cooldown"}
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
			expectDefined(mock);
			expect(mock).toHaveBeenCalledOnce();
			expect(mock).toHaveBeenCalledWith(
				expect.objectContaining({
					client: mockClient,
					message: mockMessage,
					options: command
						.split(/ +/u)
						.slice(1)
						.map(name => ({ name, type: ApplicationCommandOptionType.String })),
				}),
			);
		});

		test.each`
			localized           | command
			${"präfixsetzen"}   | ${"setprefix"}
			${"hilfe"}          | ${"help"}
			${"ayuda"}          | ${"help"}
			${"segítség"}       | ${"help"}
			${"spieltjetzt"}    | ${"nowplaying"}
			${"jugandoahora"}   | ${"nowplaying"}
			${"jouemaintenant"} | ${"nowplaying"}
		`(
			"calls the $command command from localized name '$localized'",
			async ({ command, localized }: { command: string; localized: string }) => {
				mockMessage.content = `${prefix}${localized}`;
				mockMessage.author.bot = false;
				await handleCommand(mockMessage, logger);

				const mockCommand = mockCommandDefinitions.get(command.replace("-", ""));
				const mock = mockCommand?.execute;
				expectDefined(mock);
				expect(mock).toHaveBeenCalledOnce();
				expect(mock).toHaveBeenCalledWith(
					expect.objectContaining({
						client: mockClient,
						message: mockMessage,
						options: command
							.split(/ +/u)
							.slice(1)
							.map(name => ({ name, type: ApplicationCommandOptionType.String })),
					}),
				);
			},
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
		`(
			`ignores bot sending the command '${prefix}$command'`,
			async ({ command }: { command: string }) => {
				mockMessage.content = `${prefix}${command}`;
				mockMessage.author.bot = true;
				await handleCommand(mockMessage, logger);

				for (const cmd of mockCommandDefinitions.values()) {
					expect(cmd.execute).not.toHaveBeenCalled();
				}
				expect.assertions(mockCommandDefinitions.size);
			},
		);

		test("Command alias `now-playing` calls command `nowplaying`", async () => {
			mockMessage.content = `${prefix}now-playing`;
			await handleCommand(mockMessage, logger);

			const mockNowPlaying = mockCommandDefinitions.get("nowplaying");
			expectDefined(mockNowPlaying);
			expect(mockNowPlaying.execute).toHaveBeenCalledOnce();
		});
	});
});
