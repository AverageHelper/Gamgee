import { Entity, PrimaryColumn, ManyToMany } from "typeorm";
import { QueueConfig } from "./QueueConfig.js";

@Entity()
export class User {
	@PrimaryColumn({ unique: true })
	id: string;

	/** Queues from which the user is barred from submitting requests. */
	@ManyToMany(() => QueueConfig, queue => queue.blacklistedUsers ?? [], {
		nullable: false
	})
	blacklistedQueues!: Array<QueueConfig>;

	constructor(id: string);
	constructor(id?: string) {
		this.id = id ?? "";
	}
}
