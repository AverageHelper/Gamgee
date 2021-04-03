import type Discord from "discord.js";
import defaultValueForConfigKey from "./constants/config/defaultValueForConfigKey";

jest.mock("./commands");
import * as mockCommandDefinitions from "./commands";

import { handleCommand } from "./handleCommand";

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
        await handleCommand(mockClient, mockMessage, null);

        Object.values(mockCommandDefinitions).forEach(cmd =>
          expect(cmd.execute).not.toHaveBeenCalled()
        );
        expect.assertions(Object.keys(mockCommandDefinitions).length);
      }
    );

    test.each`
      command      | mock
      ${"config"}  | ${mockCommandDefinitions.config.execute}
      ${"help"}    | ${mockCommandDefinitions.help.execute}
      ${"ping"}    | ${mockCommandDefinitions.ping.execute}
      ${"t"}       | ${mockCommandDefinitions.type.execute}
      ${"sr"}      | ${mockCommandDefinitions.songRequest.execute}
      ${"video"}   | ${mockCommandDefinitions.video.execute}
      ${"version"} | ${mockCommandDefinitions.version.execute}
    `(
      "calls the $command command",
      async ({ command, mock }: { command: string; mock: jest.Mock }) => {
        mockMessage.content = `${prefix}${command}`;
        mockMessage.author.bot = false;
        await handleCommand(mockClient, mockMessage, null);

        expect(mock).toHaveBeenCalledTimes(1);
        expect(mock).toHaveBeenCalledWith(
          expect.toContainEntries([
            ["client", mockClient],
            ["message", mockMessage],
            ["args", command.split(/ +/u).slice(1)],
            ["storage", null]
          ])
        );
      }
    );

    test.each`
      command
      ${"config"}
      ${"help"}
      ${"ping"}
      ${"t"}
      ${"sr"}
      ${"video"}
      ${"version"}
    `(
      `ignores bot sending the command '${prefix}$command'`,
      async ({ command }: { command: string }) => {
        mockMessage.content = `${prefix}${command}`;
        mockMessage.author.bot = true;
        await handleCommand(mockClient, mockMessage, null);

        Object.values(mockCommandDefinitions).forEach(cmd =>
          expect(cmd.execute).not.toHaveBeenCalled()
        );
        expect.assertions(Object.keys(mockCommandDefinitions).length);
      }
    );
  });
});
