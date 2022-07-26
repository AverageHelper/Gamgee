import type { Snowflake } from "discord.js";
import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity({ name: "queue-entries" })
export class QueueEntry {
	@Column()
	channelId: Snowflake;

	@Column()
	guildId: Snowflake;

	@Column({ unique: true })
	queueMessageId: Snowflake;

	@Column()
	url: string;

	@Column({ type: "integer" })
	seconds: number;

	@PrimaryColumn({ unique: true })
	sentAt: Date;

	@Column()
	senderId: Snowflake;

	@Column()
	isDone: boolean;

	@Column({ type: "simple-array", nullable: true })
	haveCalledNowPlaying: Array<Snowflake>;

	constructor(
		channelId: Snowflake,
		guildId: Snowflake,
		entry: Omit<QueueEntry, "channelId" | "guildId">
	);
	constructor(
		channelId?: Snowflake,
		guildId?: Snowflake,
		entry?: Omit<QueueEntry, "channelId" | "guildId">
	) {
		this.channelId = channelId ?? "0";
		this.guildId = guildId ?? "0";
		this.queueMessageId = entry?.queueMessageId ?? "0";
		this.url = entry?.url ?? "";
		this.seconds = entry?.seconds ?? 0;
		this.sentAt = entry?.sentAt ?? new Date();
		this.senderId = entry?.senderId ?? "0";
		this.isDone = entry?.isDone ?? false;
		this.haveCalledNowPlaying = entry?.haveCalledNowPlaying ?? [];
	}
}
