import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity({ name: "guilds" })
export class Guild {
  @PrimaryColumn({ unique: true, nullable: false })
  id: string;

  @Column({ nullable: false })
  isQueueOpen: boolean;

  @Column({ nullable: true })
  currentQueue: string | null;

  constructor(id: string, isQueueOpen: boolean = false, currentQueue: string | null = null) {
    this.id = id;
    this.isQueueOpen = isQueueOpen;
    this.currentQueue = currentQueue;
  }
}
