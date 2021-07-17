import type Discord from "discord.js";
import type { URL } from "url";

export interface MessageButton {
	id: string;
	label: string;
	style: Discord.MessageButtonStyleResolvable;
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

export function actionRow(buttons: NonEmptyArray<MessageButton>): Discord.MessageActionRowOptions {
	return {
		type: "ACTION_ROW",
		components: buttons.map<Discord.MessageButtonOptions>(btn => ({
			type: "BUTTON",
			style: btn.style,
			label: btn.label,
			emoji: btn.emoji,
			url: btn.url?.toString(),
			customID: btn.id
		}))
	};
}
