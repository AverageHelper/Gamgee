import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity({ name: "queue-configs" })
export class QueueConfig {
  /** The ID of the queue channel. */
  @PrimaryColumn({ unique: true })
  channelId: string;

  /** The maximum time in seconds that a new queue entry may take to play. */
  @Column({ type: "integer", nullable: true })
  entryDurationSeconds: number | null;

  /** The number of seconds that a user must wait between successful queue submissions. */
  @Column({ type: "integer", nullable: true })
  cooldownSeconds: number | null;

  /** The maximum number of successful submissions each user may have in the queue. */
  @Column({ type: "integer", nullable: true })
  submissionMaxQuantity: number | null;

  constructor(channelId: string, config: Omit<QueueConfig, "channelId">);
  constructor(channelId?: string, config?: Omit<QueueConfig, "channelId">) {
    this.channelId = channelId ?? "";
    this.entryDurationSeconds = config?.entryDurationSeconds ?? null;
    this.cooldownSeconds = config?.cooldownSeconds ?? null;
    this.submissionMaxQuantity = config?.submissionMaxQuantity ?? null;
  }
}
