jest.mock("github-metadata");

import gitHubMetadata from "github-metadata";
const mockGithubMetadata = gitHubMetadata as jest.Mock;

const mockSend = jest.fn();
const mockStartTyping = jest.fn();
const mockStopTyping = jest.fn();

import type { CommandContext } from "./Command";
import languages from "./languages";
import { useTestLogger } from "../../tests/testUtils/logger";

const logger = useTestLogger("error");

describe("Language Statistics from GitHub", () => {
  const mockMessage = {
    channel: {
      send: mockSend,
      startTyping: mockStartTyping,
      stopTyping: mockStopTyping
    }
  };
  const context = ({ logger, message: mockMessage } as unknown) as CommandContext;

  beforeEach(() => {
    mockGithubMetadata.mockResolvedValue({
      languages: {
        English: 80,
        Spanish: 10,
        Indonesian: 5,
        HTML: 5
      }
    });
    mockSend.mockResolvedValue(undefined);
    mockStartTyping.mockResolvedValue(undefined);
    mockStopTyping.mockReturnValue(undefined);
  });

  test("asks GitHub about my language statistics", async () => {
    await expect(languages.execute(context)).resolves.toBe(undefined);

    const owner = "AverageHelper";
    const repo = "Gamgee";
    expect(mockGithubMetadata).toHaveBeenCalledTimes(1);
    expect(mockGithubMetadata).toHaveBeenCalledWith({
      owner,
      repo,
      exclude: expect.not.arrayContaining(["languages"]) as Array<string>
    });

    expect(mockSend).toHaveBeenCalled();
    expect(mockSend).toHaveBeenCalledWith(expect.toContainValue("4"));

    // indicates loading properly
    expect(mockStartTyping).toHaveBeenCalledTimes(1);
    expect(mockStopTyping).toHaveBeenCalledTimes(1);
    expect(mockStopTyping).not.toHaveBeenCalledBefore(mockStartTyping);
    expect(mockStopTyping).not.toHaveBeenCalledBefore(mockGithubMetadata);
    expect(mockStartTyping).not.toHaveBeenCalledAfter(mockStopTyping);
    expect(mockStartTyping).not.toHaveBeenCalledAfter(mockGithubMetadata);
  });
});