import type { Snowflake } from "discord.js";
import { DEFAULT_MESSAGE_COMMAND_PREFIX } from "../../constants/database.js";
import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity({ name: "guilds" })
export class Guild {
	@PrimaryColumn({ unique: true })
	id: Snowflake;

	@Column()
	isQueueOpen: boolean;

	@Column({ type: "text", nullable: true })
	currentQueue: Snowflake | null;

	@Column({ default: DEFAULT_MESSAGE_COMMAND_PREFIX })
	messageCommandPrefix: string;

	constructor(
		id: Snowflake,
		isQueueOpen: boolean,
		currentQueue: Snowflake | null,
		messageCommandPrefix: string
	);
	constructor(
		id?: Snowflake,
		isQueueOpen: boolean = false,
		currentQueue: Snowflake | null = null,
		messageCommandPrefix: string = DEFAULT_MESSAGE_COMMAND_PREFIX
	) {
		this.id = id ?? "0";
		this.isQueueOpen = isQueueOpen;
		this.currentQueue = currentQueue;
		this.messageCommandPrefix = messageCommandPrefix;
	}
}
