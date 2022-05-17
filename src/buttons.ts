import Discord from "discord.js";
import type { URL } from "url";

export interface MessageButton {
	id: string;
	label: string;
	style: "PRIMARY" | "SECONDARY" | "SUCCESS" | "DANGER";
	emoji?: Discord.EmojiIdentifierResolvable;
	url?: URL;
}

export const DONE_BUTTON: MessageButton = {
	id: "DONE",
	label: "Done",
	style: "SUCCESS"
};

export const DELETE_BUTTON: MessageButton = {
	id: "DELETE",
	label: "Reject",
	style: "DANGER"
};

export const RESTORE_BUTTON: MessageButton = {
	id: "RESTORE",
	label: "Restore",
	style: "SECONDARY"
};

export function actionRow(buttons: NonEmptyArray<MessageButton>): Discord.MessageActionRow {
	const row = new Discord.MessageActionRow();
	row.setComponents(
		buttons.map<Discord.MessageActionRowComponentResolvable>(btn => ({
			type: "BUTTON",
			style: btn.style,
			label: btn.label,
			emoji: btn.emoji,
			url: btn.url?.toString() ?? "",
			customId: btn.id
		}))
	);
	return row;
}
