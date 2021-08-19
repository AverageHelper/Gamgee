jest.mock("github-metadata");

import gitHubMetadata from "github-metadata";
const mockGithubMetadata = gitHubMetadata as jest.Mock;

const mockReply = jest.fn().mockResolvedValue(undefined);
const mockPrepareForLongRunningTasks = jest.fn().mockResolvedValue(undefined);

import type { CommandContext } from "./Command";
import languages from "./languages";
import { useTestLogger } from "../../tests/testUtils/logger";

const logger = useTestLogger("error");

describe("Language Statistics from GitHub", () => {
	let context: CommandContext;

	beforeEach(() => {
		context = ({
			logger,
			prepareForLongRunningTasks: mockPrepareForLongRunningTasks,
			reply: mockReply
		} as unknown) as CommandContext;

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
		expect(mockGithubMetadata).toHaveBeenCalledWith({
			owner,
			repo,
			exclude: expect.not.arrayContaining(["languages"]) as Array<string>
		});

		expect(mockReply).toHaveBeenCalled();
		expect(mockReply).toHaveBeenCalledWith(expect.toContainValue("4"));
	});
});
