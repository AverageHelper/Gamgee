import type { ComponentEmojiResolvable, MessageActionRowComponentBuilder } from "discord.js";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export interface MessageButton {
	id: string;
	label: string;
	style: ButtonStyle;
	emoji?: ComponentEmojiResolvable;
	url?: URL;
}

export const DONE_BUTTON: MessageButton = {
	id: "DONE",
	label: "Done",
	style: ButtonStyle.Success
};

export const DELETE_BUTTON: MessageButton = {
	id: "DELETE",
	label: "Reject",
	style: ButtonStyle.Danger
};

export const RESTORE_BUTTON: MessageButton = {
	id: "RESTORE",
	label: "Restore",
	style: ButtonStyle.Secondary
};

export function actionRow(
	buttons: Readonly<NonEmptyArray<Readonly<MessageButton>>>
): ActionRowBuilder<MessageActionRowComponentBuilder> {
	return new ActionRowBuilder<MessageActionRowComponentBuilder>() //
		.setComponents(
			buttons.map(btn => {
				const result = new ButtonBuilder()
					.setStyle(btn.style)
					.setLabel(btn.label)
					.setCustomId(btn.id);
				if (btn.emoji !== undefined) {
					result.setEmoji(btn.emoji);
				}
				if (btn.url) {
					result.setURL(btn.url.href);
				}
				return result;
			})
		);
}
