jest.mock("./actions");
jest.mock("../../actions/messages");
jest.mock("../../useGuildStorage");
jest.mock("../../actions/queue/getQueueChannel");
jest.mock("../../actions/queue/useQueue");
jest.mock("../../actions/getVideoDetails");

import * as messageActions from "./actions";
const mockRejectPrivate = messageActions.reject_private as jest.Mock;

import * as queueActions from "../../actions/queue/useQueue";
const mockUseQueue = queueActions.useQueue as jest.Mock;

import * as guildStorage from "../../useGuildStorage";
const mockGuildStorage = guildStorage.useGuildStorage as jest.Mock;

import getQueueChannel from "../../actions/queue/getQueueChannel";
const mockGetQueueChannel = getQueueChannel as jest.Mock;

import getVideoDetails from "../../actions/getVideoDetails";
const mockGetVideoDetails = getVideoDetails as jest.Mock;
mockGetVideoDetails.mockImplementation(async (query: Array<string>) => {
  // Enough uncertainty that *something* should go out of order if it's going to
  const ms = Math.floor(Math.random() * 50);
  await new Promise(resolve => setTimeout(resolve, ms));
  return {
    url: query[0],
    title: "video-title",
    duration: {
      seconds: 500
    },
    fromUrl: true
  };
});

import type Discord from "discord.js";
import type { CommandContext } from "../Command";
import urlRequest from "./urlRequest";
import { useTestLogger } from "../../../tests/testUtils/logger";

const logger = useTestLogger("error");

describe("Song request via URL", () => {
  const urls: [string, string, string, string, string, string, string, string, string, string] = [
    "https://youtu.be/dQw4w9WgXcQ",
    "https://youtu.be/9RAQsdTQIcs",
    "https://youtu.be/tao1Ic8qVkM",
    "https://youtu.be/sSukg-tAK1k",
    "https://youtu.be/9eWHXhLu-uM",
    "https://youtu.be/jeKH5HhmNQc",
    "https://youtu.be/NUYvbT6vTPs",
    "https://youtu.be/aekVhtK9yuQ",
    "https://youtu.be/BwyY5LdpECA",
    "https://youtu.be/7btMEX3kAPo"
  ];
  const botId = "this-user";

  const mockReply = jest.fn().mockResolvedValue(undefined);
  const mockChannelSend = jest.fn().mockResolvedValue(undefined);
  const mockChannelStartTyping = jest.fn().mockResolvedValue(undefined);
  const mockChannelStopTyping = jest.fn().mockResolvedValue(undefined);

  const mockQueueGetLatestUserEntry = jest.fn().mockResolvedValue(null);
  const mockQueueUserEntryCount = jest.fn().mockResolvedValue(0);

  const mockQueuePush = jest.fn();

  mockGuildStorage.mockReturnValue({
    isQueueOpen: jest.fn().mockResolvedValue(true)
  });

  mockGetQueueChannel.mockResolvedValue({
    id: "queue-channel-123",
    name: "queue",
    startTyping: mockChannelStartTyping,
    stopTyping: mockChannelStopTyping
  });

  mockUseQueue.mockReturnValue({
    getConfig: jest.fn().mockResolvedValue({
      entryDurationSeconds: null,
      cooldownSeconds: 600,
      submissionMaxQuantity: null,
      blacklistedUsers: []
    }),
    push: mockQueuePush,
    getLatestEntryFrom: mockQueueGetLatestUserEntry,
    countFrom: mockQueueUserEntryCount
  });

  const mockClient: Discord.Client = ({ user: { id: botId } } as unknown) as Discord.Client;

  function mockMessage(senderId: string, content: string): Discord.Message {
    const mockSenderMember: Discord.GuildMember = ({
      user: { id: senderId }
    } as unknown) as Discord.GuildMember;

    return ({
      content,
      author: {
        bot: false,
        id: mockSenderMember.user.id,
        username: senderId
      },
      createdAt: new Date(),
      client: (mockClient as unknown) as Discord.Client,
      reply: mockReply,
      channel: {
        id: "request-channel-456",
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
  }

  test("only a user's first submission gets in if a cooldown exists", async () => {
    const mockMessage1 = mockMessage("another-user", `?sr ${urls[0]}`);
    const mockMessage2 = mockMessage("another-user", `?sr ${urls[1]}`);

    mockQueuePush.mockImplementationOnce(() => {
      mockQueueGetLatestUserEntry.mockResolvedValueOnce({
        queueMessageId: mockMessage1.id,
        url: urls[0],
        seconds: 500,
        sentAt: new Date(),
        senderId: mockMessage1.author.id,
        isDone: false
      });
      mockQueueUserEntryCount.mockResolvedValueOnce(1);
      return Promise.resolve();
    });

    const context1 = ({
      args: [urls[0]],
      message: mockMessage1,
      logger
    } as unknown) as CommandContext;
    const context2 = { ...context1, args: [urls[1]], message: mockMessage2 };

    // Request a song twice in quick succession
    void urlRequest.execute(context1);
    await urlRequest.execute(context2);

    // Wait for handles to close
    await new Promise(resolve => setTimeout(resolve, 500));

    // queue.push should only have been called on the first URL
    expect(mockQueuePush).toHaveBeenCalledTimes(1);
    expect(mockQueuePush).toHaveBeenCalledWith(expect.toContainEntry(["url", urls[0]]));

    // The submission should have been rejected with a cooldown warning via DMs
    expect(mockRejectPrivate).toHaveBeenCalledTimes(1);
  });

  test("submissions enter the queue in order", async () => {
    const mockMessages: Array<Discord.Message> = [];
    urls.forEach((url, i) => {
      const userId = `user-${i + 1}`;
      const message = mockMessage(userId, `?sr ${url}`);
      mockMessages.push(message);
    });

    await Promise.all([
      mockMessages
        .map(message => {
          const args = message.content.split(" ").slice(1);
          return ({
            args,
            message,
            logger
          } as unknown) as CommandContext;
        })
        .map(urlRequest.execute)
    ]);

    // Wait for handles to close
    await new Promise(resolve => setTimeout(resolve, 500));

    // queue.push should have been called on each URL
    urls.forEach((url, i) => {
      expect(mockQueuePush).toHaveBeenNthCalledWith(
        i + 1,
        expect.toContainEntries([
          ["url", url],
          ["senderId", `user-${i + 1}`]
        ])
      );
    });
    expect(mockQueuePush).toHaveBeenCalledTimes(10);
  });
});
