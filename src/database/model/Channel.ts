import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity({ name: "channels" })
export class Channel {
	@PrimaryColumn({ unique: true })
	id: string;

	@Column()
	guildId: string;

	constructor(id: string, guildId: string);
	constructor(id?: string, guildId?: string) {
		this.id = id ?? "";
		this.guildId = guildId ?? "";
	}
}
