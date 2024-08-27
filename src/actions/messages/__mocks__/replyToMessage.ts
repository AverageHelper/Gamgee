import type {
	sendPrivately as _sendPrivately,
	replyPrivately as _replyPrivately,
	reply as _reply,
} from "../replyToMessage.js";
import { vi } from "vitest";

export const sendPrivately = vi.fn<typeof _sendPrivately>().mockResolvedValue(null);
export const replyPrivately = vi.fn<typeof _replyPrivately>().mockResolvedValue(false);
export const reply = vi.fn<typeof _reply>().mockResolvedValue(null);
