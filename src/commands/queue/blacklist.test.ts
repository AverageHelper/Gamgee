jest.mock("../../actions/queue/getQueueChannel");
jest.mock("../../useQueueStorage");
jest.mock("../../helpers/getUserFromMention");
jest.mock("../../permissions");

import getUserFromMention from "../../helpers/getUserFromMention";
const mockGetUserFromMention = getUserFromMention as jest.Mock;

import { userIsAdminForQueueInGuild } from "../../permissions";
const mockUserIsAdminForQueueInGuild = userIsAdminForQueueInGuild as jest.Mock;

import getQueueChannel from "../../actions/queue/getQueueChannel";
const mockGetQueueChannel = getQueueChannel as jest.Mock;

import { useQueueStorage } from "../../useQueueStorage";
const mockUseQueueStorage = useQueueStorage as jest.Mock;

import type { QueueEntryManager } from "../../useQueueStorage";
import type { CommandContext } from "../Command";
import { useTestLogger } from "../../../tests/testUtils/logger";
import blacklist from "./blacklist";

const mockBlacklistUser = jest.fn();
const mockGetConfig = jest.fn();
const mockReply = jest.fn().mockResolvedValue(undefined);
const mockDeleteMessage = jest.fn().mockResolvedValue(undefined);
const mockReplyPrivately = jest.fn().mockResolvedValue(undefined);

const logger = useTestLogger("error");

describe("Manage the Queue Blacklist", () => {
  const queueChannelId = "queue-channel";

  const ownerID = "server-owner";
  const badUserId = "bad-user";

  let context: CommandContext;
  let queue: QueueEntryManager;

  beforeEach(() => {
    context = ({
      type: "message",
      guild: {
        ownerID,
        name: "Test Guild"
      },
      user: { id: "test-user" },
      options: [
        {
          name: "user",
          value: `<@${badUserId}>`
        }
      ],
      logger,
      reply: mockReply,
      replyPrivately: mockReplyPrivately,
      deleteInvocation: mockDeleteMessage
    } as unknown) as CommandContext;

    queue = ({
      blacklistUser: mockBlacklistUser,
      getConfig: mockGetConfig
    } as unknown) as QueueEntryManager;

    mockGetQueueChannel.mockResolvedValue({ id: queueChannelId });
    mockGetUserFromMention.mockResolvedValue({ id: badUserId });
    mockGetConfig.mockResolvedValue({ blacklistedUsers: [] });

    mockUseQueueStorage.mockReturnValue(queue);
    mockBlacklistUser.mockResolvedValue(undefined);
    mockReply.mockResolvedValue(undefined);
    mockDeleteMessage.mockResolvedValue(undefined);
    mockReplyPrivately.mockResolvedValue(undefined);

    mockUserIsAdminForQueueInGuild.mockResolvedValue(true);
  });

  describe("Listing Blacklisted Users", () => {
    test("reads off the list of blacklisted users when no user is provided (empty space)", async () => {
      context.options = [];
      await expect(blacklist.execute(context)).resolves.toBe(undefined);

      expect(mockBlacklistUser).not.toHaveBeenCalled();
      expect(mockReply).toHaveBeenCalledTimes(1);
      expect(mockReply).toHaveBeenCalledWith(expect.stringContaining("your DMs"));
      expect(mockReplyPrivately).toHaveBeenCalledWith(
        expect.stringContaining(`?sr ${blacklist.name} <user mention>`)
      );
    });

    test("reads off the list of blacklisted users when no user is provided (no further text)", async () => {
      context.options = [];
      await expect(blacklist.execute(context)).resolves.toBe(undefined);

      expect(mockBlacklistUser).not.toHaveBeenCalled();
      expect(mockReply).toHaveBeenCalledTimes(1); // only called when not a '/' command
      expect(mockReply).toHaveBeenCalledWith(expect.stringContaining("your DMs"));
      expect(mockReplyPrivately).toHaveBeenCalledWith(
        expect.stringContaining(`?sr ${blacklist.name} <user mention>`)
      );
    });
  });

  describe("Adding Users", () => {
    test("does nothing when not in a guild", async () => {
      context.guild = null;
      await expect(blacklist.execute(context)).resolves.toBe(undefined);

      expect(mockBlacklistUser).not.toHaveBeenCalled();
    });

    test("does nothing against the calling user", async () => {
      mockGetUserFromMention.mockResolvedValue({ id: context.user.id });
      await expect(blacklist.execute(context)).resolves.toBe(undefined);

      expect(mockBlacklistUser).not.toHaveBeenCalled();
      expect(mockReply).toHaveBeenCalledTimes(1);
      expect(mockReply).toHaveBeenCalledWith(expect.stringContaining("blacklist yourself"), {
        ephemeral: true
      });
    });

    test("does nothing against the server owner", async () => {
      mockGetUserFromMention.mockResolvedValue({ id: ownerID });
      await expect(blacklist.execute(context)).resolves.toBe(undefined);

      expect(mockBlacklistUser).not.toHaveBeenCalled();
      expect(mockReply).toHaveBeenCalledTimes(1);
      expect(mockReply).toHaveBeenCalledWith(expect.stringContaining("blacklist the owner"), {
        ephemeral: true
      });
    });

    test("does nothing against the server owner, even when the owner is the caller", async () => {
      context.user.id = ownerID;
      mockGetUserFromMention.mockResolvedValue({ id: ownerID });
      await expect(blacklist.execute(context)).resolves.toBe(undefined);

      expect(mockBlacklistUser).not.toHaveBeenCalled();
      expect(mockReply).toHaveBeenCalledTimes(1);
      expect(mockReply).toHaveBeenCalledWith(expect.stringContaining("blacklist yourself"), {
        ephemeral: true
      });
    });

    test("does nothing against a user not known to the guild", async () => {
      mockGetUserFromMention.mockResolvedValue(undefined);
      await expect(blacklist.execute(context)).resolves.toBe(undefined);

      expect(mockBlacklistUser).not.toHaveBeenCalled();
    });

    test("does nothing when there's no queue", async () => {
      mockGetQueueChannel.mockResolvedValueOnce(null);
      await expect(blacklist.execute(context)).resolves.toBe(undefined);

      expect(mockBlacklistUser).not.toHaveBeenCalled();
    });

    test("does nothing when the caller is not admin", async () => {
      mockUserIsAdminForQueueInGuild.mockResolvedValueOnce(false);
      await expect(blacklist.execute(context)).resolves.toBe(undefined);

      expect(mockBlacklistUser).not.toHaveBeenCalled();
    });

    test("calls blacklistUser for queue when the caller is admin", async () => {
      await expect(blacklist.execute(context)).resolves.toBe(undefined);

      // permissions got checked
      expect(mockUserIsAdminForQueueInGuild).toHaveBeenCalledTimes(1);
      expect(mockUserIsAdminForQueueInGuild).toHaveBeenCalledWith(context.user, context.guild);

      // blacklist effect
      expect(mockBlacklistUser).toHaveBeenCalledTimes(1);
      expect(mockBlacklistUser).toHaveBeenCalledWith(badUserId);

      // response
      expect(mockReply).toHaveBeenCalledTimes(1);
      expect(mockReply).toHaveBeenCalledWith(expect.stringContaining(badUserId), {
        shouldMention: false,
        ephemeral: true
      });
      expect(mockDeleteMessage).toHaveBeenCalledTimes(1);
      expect(mockDeleteMessage).toHaveBeenCalledWith();
    });
  });
});
