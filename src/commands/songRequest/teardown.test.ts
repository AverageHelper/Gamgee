jest.mock("./actions");
jest.mock("../../actions/messages");
jest.mock("../../permissions");
jest.mock("../../useGuildStorage");

import * as messageActions from "./actions";
const mockReply = messageActions.reply as jest.Mock;

import * as otherMessageActions from "../../actions/messages";
const mockReplyPrivately = otherMessageActions.replyPrivately as jest.Mock;

import { userIsGuildAdmin } from "../../permissions";
const mockUserIsGuildAdmin = userIsGuildAdmin as jest.Mock;

import { useGuildStorage } from "../../useGuildStorage";
const mockUseGuildStorage = useGuildStorage as jest.Mock;

const mockSetQueueChannel = jest.fn();

import teardown from "./teardown";
import { useTestLogger } from "../../../tests/testUtils/logger";
import type { CommandContext } from "../Command";

const logger = useTestLogger("error");

describe("Queue teardown", () => {
  beforeEach(() => {
    mockReplyPrivately.mockResolvedValue(undefined);
    mockUserIsGuildAdmin.mockResolvedValue(true);
    mockUseGuildStorage.mockReturnValue({
      setQueueChannel: mockSetQueueChannel
    });
    mockSetQueueChannel.mockResolvedValue(undefined);
  });

  test("does nothing about a message with no guild", async () => {
    const context = {
      logger,
      message: "reply to me"
    };

    await expect(teardown.execute((context as unknown) as CommandContext)).toResolve();

    expect(mockReply).toHaveBeenCalledTimes(1);
    expect(mockReply).toHaveBeenCalledWith(context.message, "Can't do that here.");
    expect(mockSetQueueChannel).not.toHaveBeenCalled();
  });

  test("does nothing when the sender doesn't have permission", async () => {
    mockUserIsGuildAdmin.mockResolvedValue(false);
    const context = {
      logger,
      message: {
        guild: "the guild"
      }
    };

    await expect(teardown.execute((context as unknown) as CommandContext)).toResolve();

    expect(mockReply).not.toHaveBeenCalled();
    expect(mockReplyPrivately).toHaveBeenCalledTimes(1);
    expect(mockReplyPrivately).toHaveBeenCalledWith(
      context.message,
      "YOU SHALL NOT PAAAAAASS!\nOr, y'know, something like that..."
    );
    expect(mockSetQueueChannel).not.toHaveBeenCalled();
  });

  test("unsets the guild queue", async () => {
    const context = {
      logger,
      message: {
        guild: "the guild"
      }
    };

    await expect(teardown.execute((context as unknown) as CommandContext)).toResolve();

    expect(mockReplyPrivately).not.toHaveBeenCalled();
    expect(mockReply).toHaveBeenCalledTimes(1);
    expect(mockReply).toHaveBeenCalledWith(context.message, "Queue deleted.");
    expect(mockSetQueueChannel).toHaveBeenCalledTimes(1);
    expect(mockSetQueueChannel).toHaveBeenCalledWith(null);
  });
});
