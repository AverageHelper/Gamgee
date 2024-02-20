import { vi } from "vitest";

export const deleteMessage = vi.fn().mockResolvedValue(true);
export const deleteMessageWithId = vi.fn().mockResolvedValue(true);
export const bulkDeleteMessagesWithIds = vi.fn().mockResolvedValue(true);
