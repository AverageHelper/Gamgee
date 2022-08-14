const mockGithubMetadata = jest.fn();
jest.mock("../helpers/githubMetadata", () => ({ gitHubMetadata: mockGithubMetadata }));

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

		mockGithubMetadata.mockResolvedValue({
			languages: {
				English: 80,
				Spanish: 10,
				Indonesian: 5,
				HTML: 5
			}
		});
	});

	test("asks GitHub about my language statistics", async () => {
		await expect(languages.execute(context)).resolves.toBeUndefined();

		const owner = "AverageHelper";
		const repo = "Gamgee";
		expect(mockGithubMetadata).toHaveBeenCalledTimes(1);
		expect(mockGithubMetadata).toHaveBeenCalledWith({ owner, repo });

		expect(mockReply).toHaveBeenCalled();
		expect(mockReply).toHaveBeenCalledWith(expect.toContainValue("4"));
	});
});
