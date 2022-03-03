import type Discord from "discord.js";
import { resolveChannelFromOption } from "./optionResolvers.js";

const mockResolveChannel = jest.fn();

describe("Option Resolver", () => {
	let guild: Discord.Guild;
	let option: Discord.CommandInteractionOption;

	beforeEach(() => {
		guild = ({
			channels: {
				resolve: mockResolveChannel
			}
		} as unknown) as Discord.Guild;
		option = {
			name: "option",
			type: "STRING"
		};
	});

	describe("Channel", () => {
		test("returns null from an empty option", () => {
			option.value = undefined;
			const resolved = resolveChannelFromOption(option, guild);
			expect(resolved).toBeNull();
		});

		test("returns null from an empty string value", () => {
			option.value = "";
			const resolved = resolveChannelFromOption(option, guild);
			expect(resolved).toBeNull();
		});

		test("returns null from a malformatted string", () => {
			option.value = "notachannel";
			const resolved = resolveChannelFromOption(option, guild);
			expect(resolved).toBeNull();
		});

		test("parses a channel ID from a string value", () => {
			const channelId = "resolveme";
			option.value = `<#${channelId}>`;
			resolveChannelFromOption(option, guild);

			expect(mockResolveChannel).toHaveBeenCalledTimes(1);
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
