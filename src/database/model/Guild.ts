import type { Snowflake } from "discord.js";
import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity({ name: "guilds" })
export class Guild {
	@PrimaryColumn({ unique: true })
	id: Snowflake;

	@Column()
	isQueueOpen: boolean;

	@Column({ type: "text", nullable: true })
	currentQueue: Snowflake | null;

	constructor(id: Snowflake, isQueueOpen: boolean, currentQueue: Snowflake | null);
	constructor(id?: Snowflake, isQueueOpen: boolean = false, currentQueue: Snowflake | null = null) {
		this.id = id ?? "0";
		this.isQueueOpen = isQueueOpen;
		this.currentQueue = currentQueue;
	}
}
