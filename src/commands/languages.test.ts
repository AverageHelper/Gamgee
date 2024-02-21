import type { Mock } from "vitest";
import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../helpers/gitForgeMetadata.js");
import { gitForgeMetadata } from "../helpers/gitForgeMetadata.js";
const mockGitForgeMetadata = gitForgeMetadata as Mock<
	Parameters<typeof gitForgeMetadata>,
	ReturnType<typeof gitForgeMetadata>
>;
mockGitForgeMetadata.mockResolvedValue({
	name: "",
	full_name: "",
	private: false,
	html_url: "",
	description: "",
	languages_url: "",
	languages: {
		English: 80,
		Spanish: 10,
		Indonesian: 5,
		HTML: 5,
	},
});

const mockReply = vi.fn().mockResolvedValue(undefined);
const mockFollowUp = vi.fn().mockResolvedValue({});
const mockPrepareForLongRunningTasks = vi.fn().mockResolvedValue(undefined);

import type { CommandContext } from "./Command.js";
import { languages } from "./languages.js";
import { useTestLogger } from "../../tests/testUtils/logger.js";

const logger = useTestLogger();

describe("Language Statistics from our git forge", () => {
	let context: CommandContext;

	beforeEach(() => {
		context = {
			logger,
			prepareForLongRunningTasks: mockPrepareForLongRunningTasks,
			reply: mockReply,
			followUp: mockFollowUp,
		} as unknown as CommandContext;
	});

	test("asks our git forge about our language statistics", async () => {
		const owner = "AverageHelper";
		const repo = "Gamgee";

		await expect(languages.execute(context)).resolves.toBeUndefined();
		expect(mockGitForgeMetadata).toHaveBeenCalledOnce();
		expect(mockGitForgeMetadata).toHaveBeenCalledWith({ owner, repo });

		expect(mockReply).toHaveBeenCalled();
		expect(mockReply).toHaveBeenCalledWith(expect.stringContaining("languages"));
	});
});
