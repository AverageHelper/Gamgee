import type {
	deleteMessage as _deleteMessage,
	deleteMessageWithId as _deleteMessageWithId,
	bulkDeleteMessagesWithIds as _bulkDeleteMessagesWithIds,
} from "../deleteMessage.js";
import { vi } from "vitest";

export const deleteMessage = vi.fn<typeof _deleteMessage>().mockResolvedValue(true);
export const deleteMessageWithId = vi.fn<typeof _deleteMessageWithId>().mockResolvedValue(true);
export const bulkDeleteMessagesWithIds = vi
	.fn<typeof _bulkDeleteMessagesWithIds>()
	.mockResolvedValue(true);
