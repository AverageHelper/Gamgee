import type { User } from "discord.js";
import { beforeEach, describe, test } from "vitest";
import { expectValueEqual } from "../../tests/testUtils/expectations/vitest.js";
import { logUser } from "./logUser.js";

describe("Log user ID", () => {
	const user = {} as unknown as User;

	beforeEach(() => {
		user.username = "BobJoe";
		user.id = "1234567890";
	});

	test("shows the user's username", () => {
		expectValueEqual(logUser(user), `${user.id} (${user.username})`);
	});
});
