import type Discord from "discord.js";
import { logUser } from "./logUser.js";

describe("Log user ID", () => {
	const user = {} as unknown as Discord.User;

	beforeEach(() => {
		user.username = "BobJoe";
		user.id = "1234567890";
	});

	test("shows the user's username", () => {
		expect(logUser(user)).toBe(`${user.id} (${user.username})`);
	});
});
