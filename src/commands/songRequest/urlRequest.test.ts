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
mockGetVideoDetails.mockImplementation(async (url: string) => {
  await new Promise(resolve => setTimeout(resolve, 100));
  return {
    url: url[0],
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
  const url1 = "https://youtu.be/dQw4w9WgXcQ";
  const url2 = "https://youtube.com/watch?v=9RAQsdTQIcs";
  const botId = "this-user";

  const mockReply = jest.fn().mockResolvedValue(undefined);
  const mockChannelSend = jest.fn().mockResolvedValue(undefined);
  const mockChannelStartTyping = jest.fn().mockResolvedValue(undefined);
  const mockChannelStopTyping = jest.fn().mockResolvedValue(undefined);

  const mockQueueGetLatestUserEntry = jest.fn().mockResolvedValue(null);
  const mockQueueUserEntryCount = jest.fn().mockResolvedValue(0);

  const mockQueuePush = jest.fn().mockImplementation(() => {
    mockQueueGetLatestUserEntry.mockResolvedValueOnce({
      queueMessageId: mockMessage1.id,
      url: url1,
      seconds: 500,
      sentAt: new Date(),
      senderId: mockSenderMember.user.id,
      isDone: false
    });
    mockQueueUserEntryCount.mockResolvedValueOnce(1);
    return Promise.resolve();
  });

  mockGuildStorage.mockResolvedValue({
    isQueueOpen: jest.fn().mockResolvedValue(true)
  });

  mockGetQueueChannel.mockResolvedValue({
    id: "queue-channel-123",
    name: "queue",
    startTyping: mockChannelStartTyping,
    stopTyping: mockChannelStopTyping
  });

  mockUseQueue.mockResolvedValue({
    getConfig: jest.fn().mockResolvedValue({
      entryDurationSeconds: null,
      cooldownSeconds: 600,
      submissionMaxQuantity: null
    }),
    push: mockQueuePush,
    getLatestEntryFrom: mockQueueGetLatestUserEntry,
    countFrom: mockQueueUserEntryCount
  });

  const mockClient: Discord.Client = ({ user: { id: botId } } as unknown) as Discord.Client;
  const mockSenderMember: Discord.GuildMember = ({
    user: { id: "another-user" }
  } as unknown) as Discord.GuildMember;

  const mockMessage1: Discord.Message = ({
    content: `?sr ${url1}`,
    author: {
      bot: false,
      id: mockSenderMember.user.id,
      username: "another-user"
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

  const mockMessage2: Discord.Message = ({
    ...mockMessage1,
    content: `?sr ${url2}`,
    createdAt: new Date()
  } as unknown) as Discord.Message;

  test("When there's a cooldown, only a user's first submission gets in", async () => {
    const context1 = ({
      args: [url1],
      message: mockMessage1,
      logger
    } as unknown) as CommandContext;
    const context2 = { ...context1, args: [url2], message: mockMessage2 };

    // Request a song twice in quick succession
    void urlRequest.execute(context1);
    await urlRequest.execute(context2);

    // Wait for handles to close
    await new Promise(resolve => setTimeout(resolve, 500));

    // queue.push should only have been called on the first URL
    expect(mockQueuePush).toHaveBeenCalledTimes(1);
    expect(mockQueuePush).toHaveBeenCalledWith(expect.toContainEntry(["url", url1]));

    // The submission should have been rejected with a cooldown warning via DMs
    expect(mockRejectPrivate).toHaveBeenCalledTimes(1);
  }, 10000);
});
