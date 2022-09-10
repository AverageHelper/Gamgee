jest.mock("../helpers/githubMetadata.js");
import { gitHubMetadata } from "../helpers/githubMetadata.js";
const mockGitHubMetadata = gitHubMetadata as jest.Mock;
mockGitHubMetadata.mockResolvedValue({
	languages: {
		English: 80,
		Spanish: 10,
		Indonesian: 5,
		HTML: 5
	}
});

const mockReply = jest.fn().mockResolvedValue(undefined);
const mockFollowUp = jest.fn().mockResolvedValue({});
const mockPrepareForLongRunningTasks = jest.fn().mockResolvedValue(undefined);

import type { CommandContext } from "./Command.js";
import { languages } from "./languages.js";
import { useTestLogger } from "../../tests/testUtils/logger.js";

const logger = useTestLogger("error");

describe("Language Statistics from GitHub", () => {
	let context: CommandContext;

	beforeEach(() => {
		context = {
			logger,
			prepareForLongRunningTasks: mockPrepareForLongRunningTasks,
			reply: mockReply,
			followUp: mockFollowUp
		} as unknown as CommandContext;
	});

	test("asks GitHub about my language statistics", async () => {
		const owner = "AverageHelper";
		const repo = "Gamgee";

		await expect(languages.execute(context)).resolves.toBeUndefined();
		expect(mockGitHubMetadata).toHaveBeenCalledOnce();
		expect(mockGitHubMetadata).toHaveBeenCalledWith({ owner, repo });

		expect(mockReply).toHaveBeenCalled();
		expect(mockReply).toHaveBeenCalledWith(expect.stringContaining("languages"));
	});
});
