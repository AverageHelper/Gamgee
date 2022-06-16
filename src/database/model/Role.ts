import type { Snowflake } from "discord.js";
import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity()
export class Role {
	@PrimaryColumn({ unique: true })
	id: Snowflake;

	@Column()
	guildId: Snowflake;

	@Column()
	definesGuildAdmin: boolean;

	@Column()
	definesQueueAdmin: boolean;

	constructor(id: Snowflake, guildId: Snowflake);
	constructor(id?: Snowflake, guildId?: Snowflake) {
		this.id = id ?? "0";
		this.guildId = guildId ?? "0";
		this.definesGuildAdmin = false;
		this.definesQueueAdmin = false;
	}
}
