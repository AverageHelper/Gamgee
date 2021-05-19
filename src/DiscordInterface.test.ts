import type Discord from "discord.js";
import type { MessageButton } from "./DiscordInterface";
import { DiscordInterface } from "./DiscordInterface";
import { REACTION_BTN_MUSIC } from "./constants/reactions";
import { flushPromises } from "../tests/testUtils/flushPromises";

const mockRemoveAll = jest.fn().mockResolvedValue(undefined);
const mockReact = jest.fn().mockResolvedValue(undefined);

describe("Discord Interface", () => {
  let mockClient: Discord.Client;
  let uut: DiscordInterface;

  beforeEach(() => {
    mockClient = ("the client" as unknown) as Discord.Client;
    uut = new DiscordInterface(mockClient);
  });

  describe("Add Reaction Buttons", () => {
    let message: Discord.Message;

    beforeEach(() => {
      message = ({
        id: "the-message",
        channel: {
          id: "the-message-channel"
        },
        react: mockReact,
        reactions: {
          removeAll: mockRemoveAll
        }
      } as unknown) as Discord.Message;
    });

    // adds a spacer before provided button
    test.each`
      buttons                                        | length
      ${[{ emoji: "anything" }]}                     | ${1}
      ${[{ emoji: "neigh" }, { emoji: "anything" }]} | ${2}
    `(
      "adds a spacer before the $length provided buttons",
      async ({ buttons }: { buttons: NonEmptyArray<MessageButton> }) => {
        expect.assertions(5 + buttons.length);
        expect(uut.makeInteractive(message, buttons)).toBeUndefined();

        await flushPromises();

        // Removes old emotes first
        expect(mockRemoveAll).toHaveBeenCalledTimes(1);
        expect(mockRemoveAll).not.toHaveBeenCalledAfter(mockReact);

        // Adds spacer
        expect(mockReact).toHaveBeenCalledTimes(1 + buttons.length);
        expect(mockReact).toHaveBeenNthCalledWith(1, REACTION_BTN_MUSIC);

        // Adds given buttons
        buttons.forEach((button, index) => {
          expect(mockReact).toHaveBeenNthCalledWith(index + 2, button.emoji);
        });
      }
    );
  });
});
