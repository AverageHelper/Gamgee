jest.mock("../../actions/queue/getQueueChannel");
jest.mock("../../useGuildStorage");

import getQueueChannel from "../../actions/queue/getQueueChannel";
const mockGetQueueChannel = getQueueChannel as jest.Mock;

import { useGuildStorage } from "../../useGuildStorage";
const mockUseGuildStorage = useGuildStorage as jest.Mock;

import type { GuildedCommandContext } from "../CommandContext";
import open from "./open";

const mockReply = jest.fn().mockResolvedValue(undefined);
const mockDeleteInvocation = jest.fn().mockResolvedValue(undefined);
const mockChannelSend = jest.fn().mockResolvedValue(undefined);

const mockIsQueueOpen = jest.fn();
const mockSetQueueOpen = jest.fn();

describe("Open the Queue", () => {
  let context: GuildedCommandContext;

  beforeEach(() => {
    context = ({
      guild: "the-guild",
      channel: undefined,
      reply: mockReply,
      deleteInvocation: mockDeleteInvocation
    } as unknown) as GuildedCommandContext;

    mockGetQueueChannel.mockResolvedValue({
      id: "queue-channel",
      send: mockChannelSend
    });
    mockIsQueueOpen.mockResolvedValue(true);
    mockSetQueueOpen.mockResolvedValue(undefined);

    mockUseGuildStorage.mockReturnValue({
      isQueueOpen: mockIsQueueOpen,
      setQueueOpen: mockSetQueueOpen
    });
  });

  test("cannot open without a queue in the guild", async () => {
    mockGetQueueChannel.mockResolvedValue(null);
    await expect(open.execute(context)).resolves.toBeUndefined();
    expect(mockSetQueueOpen).not.toHaveBeenCalled();
    expect(mockChannelSend).not.toHaveBeenCalled();
  });

  test("cannot open a queue when the queue is already open", async () => {
    mockIsQueueOpen.mockResolvedValue(true);
    await expect(open.execute(context)).resolves.toBeUndefined();
    expect(mockIsQueueOpen).toHaveBeenCalledTimes(1);
    expect(mockSetQueueOpen).not.toHaveBeenCalled();
    expect(mockChannelSend).not.toHaveBeenCalled();
  });

  test("opens the queue when the queue exists and is closed", async () => {
    mockIsQueueOpen.mockResolvedValue(false);
    await expect(open.execute(context)).resolves.toBeUndefined();
    expect(mockIsQueueOpen).toHaveBeenCalledTimes(1);
    expect(mockSetQueueOpen).toHaveBeenCalledTimes(1);
    expect(mockSetQueueOpen).toHaveBeenCalledWith(true);
    expect(mockChannelSend).toHaveBeenCalledTimes(1);

    expect(mockChannelSend).toHaveBeenCalledWith(expect.stringContaining("now open"));
    expect(mockReply).toHaveBeenCalledWith(expect.stringContaining("now open"));
  });
});
