import type { CommandInteractionOption, Guild } from "discord.js";
import "../../tests/testUtils/leakedHandles.js";
import { ApplicationCommandOptionType } from "discord.js";
import { expectNull } from "../../tests/testUtils/expectations/jest.js";
import { resolveChannelFromOption } from "./optionResolvers.js";

const mockResolveChannel = jest.fn();

describe("Option Resolver", () => {
	let guild: Guild;
	let option: CommandInteractionOption;

	beforeEach(() => {
		guild = {
			channels: {
				resolve: mockResolveChannel
			}
		} as unknown as Guild;
		option = {
			name: "option",
			type: ApplicationCommandOptionType.String
		};
	});

	describe("Channel", () => {
		test("returns null from an empty option", () => {
			option.value = undefined;
			const resolved = resolveChannelFromOption(option, guild);
			expectNull(resolved);
		});

		test("returns null from an empty string value", () => {
			option.value = "";
			const resolved = resolveChannelFromOption(option, guild);
			expectNull(resolved);
		});

		test("returns null from a malformatted string", () => {
			option.value = "notachannel";
			const resolved = resolveChannelFromOption(option, guild);
			expectNull(resolved);
		});

		test("parses a channel ID from a string value", () => {
			const channelId = "resolveme";
			option.value = `<#${channelId}>`;
			resolveChannelFromOption(option, guild);

			expect(mockResolveChannel).toHaveBeenCalledOnce();
			expect(mockResolveChannel).toHaveBeenCalledWith(channelId);
		});

		test("resolves a channel from a string value", () => {
			const channel = { id: "resolveme" };
			option.value = `<#${channel.id}>`;
			mockResolveChannel.mockReturnValue(channel);

			const resolved = resolveChannelFromOption(option, guild);
			expect(resolved).toStrictEqual(channel);
		});
	});
});
