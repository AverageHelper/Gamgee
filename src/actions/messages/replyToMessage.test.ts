import type { CommandInteraction, Message, User } from "discord.js";
import { DEFAULT_LOCALE } from "../../i18n.js";
import { replyPrivately, sendPrivately } from "./replyToMessage.js";

describe("Message replies", () => {
	const mockUserSend = jest.fn().mockResolvedValue({});

	let user: User;

	beforeEach(() => {
		user = {
			bot: false,
			username: "Tester",
			send: mockUserSend
		} as unknown as User;
	});

	describe("direct DMs", () => {
		test("refuses to DM a bot", async () => {
			user = { ...user, bot: true } as unknown as User;
			await expect(sendPrivately(user, "yo")).resolves.toBeNull();
			expect(mockUserSend).not.toHaveBeenCalled();
		});

		test("calls the `send` method of the given user", async () => {
			const content = "yo";
			await expect(sendPrivately(user, content)).resolves.toBeTruthy();
			expect(mockUserSend).toHaveBeenCalledOnce();
			expect(mockUserSend).toHaveBeenCalledWith(content);
		});

		test("returns `null` if the `send` method of the given user throws", async () => {
			jest.spyOn(global.console, "error").mockImplementation(() => undefined);

			mockUserSend.mockRejectedValueOnce(new Error("This is a test"));
			const content = "yo";
			await expect(sendPrivately(user, content)).resolves.toBeNull();
			expect(mockUserSend).toHaveBeenCalledOnce();
			expect(mockUserSend).toHaveBeenCalledWith(content);

			jest.restoreAllMocks();
		});
	});

	describe("interaction replies", () => {
		const mockReply = jest.fn();
		let interaction: CommandInteraction;

		beforeEach(() => {
			interaction = {
				user: {
					id: "user-1234"
				},
				reply: mockReply
			} as unknown as CommandInteraction;
		});

		test("sends an ephemeral reply with text", async () => {
			const content = "yo";
			await expect(
				replyPrivately(interaction, content, false, DEFAULT_LOCALE, DEFAULT_LOCALE)
			).resolves.toBeTrue();
			expect(mockReply).toHaveBeenCalledOnce();
			expect(mockReply).toHaveBeenCalledWith({ content, ephemeral: true });
		});

		test("returns false when an ephemeral reply with text fails", async () => {
			mockReply.mockRejectedValueOnce(new Error("This ia a test"));
			const content = "yo";
			await expect(
				replyPrivately(interaction, content, false, DEFAULT_LOCALE, DEFAULT_LOCALE)
			).resolves.toBeFalse();
			expect(mockReply).toHaveBeenCalledOnce();
			expect(mockReply).toHaveBeenCalledWith({ content, ephemeral: true });
		});

		test("sends an ephemeral reply with options", async () => {
			const content = "yo";
			await expect(
				replyPrivately(interaction, { content }, false, DEFAULT_LOCALE, DEFAULT_LOCALE)
			).resolves.toBeTrue();
			expect(mockReply).toHaveBeenCalledOnce();
			expect(mockReply).toHaveBeenCalledWith({ content, ephemeral: true });
		});

		test("returns false when an ephemeral reply with options fails", async () => {
			mockReply.mockRejectedValueOnce(new Error("This ia a test"));
			const content = "yo";
			await expect(
				replyPrivately(interaction, { content }, false, DEFAULT_LOCALE, DEFAULT_LOCALE)
			).resolves.toBeFalse();
			expect(mockReply).toHaveBeenCalledOnce();
			expect(mockReply).toHaveBeenCalledWith({ content, ephemeral: true });
		});
	});

	describe("message replies", () => {
		const mockReply = jest.fn();
		const mockChannelSend = jest.fn();
		let author: User;
		let message: Message;

		beforeEach(() => {
			author = {
				id: "user-1234",
				send: mockUserSend
			} as unknown as User;
			message = {
				author,
				channel: {
					id: "the-channel-1234",
					send: mockChannelSend
				},
				reply: mockReply
			} as unknown as Message;
		});

		test("sends a DM with a return prefix from text", async () => {
			const content = "yo";
			await expect(
				replyPrivately(message, content, true, DEFAULT_LOCALE, DEFAULT_LOCALE)
			).resolves.toBeTruthy();
			expect(mockReply).not.toHaveBeenCalled();
			expect(mockChannelSend).not.toHaveBeenCalled();
			expect(mockUserSend).toHaveBeenCalledOnce();
			expect(mockUserSend).toHaveBeenCalledWith(
				`(Reply from <#${message.channel.id}>)\n${content}`
			);
		});

		test("sends a DM with a return prefix from missing text", async () => {
			await expect(
				replyPrivately(message, { content: undefined }, true, DEFAULT_LOCALE, DEFAULT_LOCALE)
			).resolves.toBeTruthy();
			expect(mockReply).not.toHaveBeenCalled();
			expect(mockChannelSend).not.toHaveBeenCalled();
			expect(mockUserSend).toHaveBeenCalledOnce();
			expect(mockUserSend).toHaveBeenCalledWith({
				content: `(Reply from <#${message.channel.id}>)\n`
			});
		});

		test("sends a DM with a return prefix from options", async () => {
			const content = "yo";
			await expect(
				replyPrivately(message, { content }, true, DEFAULT_LOCALE, DEFAULT_LOCALE)
			).resolves.toBeTruthy();
			expect(mockReply).not.toHaveBeenCalled();
			expect(mockChannelSend).not.toHaveBeenCalled();
			expect(mockUserSend).toHaveBeenCalledOnce();
			expect(mockUserSend).toHaveBeenCalledWith({
				content: `(Reply from <#${message.channel.id}>)\n${content}`
			});
		});

		test("informs the user when DMs failed", async () => {
			jest.spyOn(global.console, "error").mockImplementation(() => undefined);

			mockUserSend.mockRejectedValueOnce(new Error("This is a test"));
			const content = "yo";
			await expect(
				replyPrivately(message, content, true, DEFAULT_LOCALE, DEFAULT_LOCALE)
			).resolves.toBeFalse();
			expect(mockReply).not.toHaveBeenCalled();
			expect(mockUserSend).toHaveBeenCalledOnce();
			expect(mockUserSend).toHaveBeenCalledWith(
				`(Reply from <#${message.channel.id}>)\n${content}`
			);
			expect(mockChannelSend).toHaveBeenCalledOnce();
			expect(mockChannelSend).toHaveBeenCalledWith(expect.stringContaining("tried to DM you"));

			jest.restoreAllMocks();
		});
	});
});
