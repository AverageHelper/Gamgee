import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity({ name: "queue-configs" })
export class QueueConfig {
  /** The ID of the queue channel. */
  @PrimaryColumn({ unique: true, nullable: false })
  channelId: string;

  /** The maximum time in seconds that a new queue entry may take to play. */
  @Column({ nullable: true })
  entryDurationSeconds: number | null;

  /** The number of seconds that a user must wait between successful queue submissions. */
  @Column({ nullable: true })
  cooldownSeconds: number | null;

  /** The maximum number of successfu; submissions each user may have in the queue. */
  @Column({ nullable: true })
  submissionMaxQuantity: number | null;

  constructor(
    channelId: string,
    entryDurationSeconds: number | null,
    cooldownSeconds: number | null,
    submissionMaxQuantity: number | null
  ) {
    this.channelId = channelId;
    this.entryDurationSeconds = entryDurationSeconds;
    this.cooldownSeconds = cooldownSeconds;
    this.submissionMaxQuantity = submissionMaxQuantity;
  }
}
