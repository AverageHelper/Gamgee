import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity({ name: "queue-entries" })
export class QueueEntry {
  @Column()
  channelId: string;

  @Column()
  guildId: string;

  @Column({ unique: true })
  queueMessageId: string;

  @Column()
  url: string;

  @Column({ type: "integer" })
  seconds: number;

  @PrimaryColumn({ unique: true })
  sentAt: Date;

  @Column()
  senderId: string;

  @Column()
  isDone: boolean;

  constructor(channelId: string, guildId: string, entry: Omit<QueueEntry, "channelId" | "guildId">);
  constructor(
    channelId?: string,
    guildId?: string,
    entry?: Omit<QueueEntry, "channelId" | "guildId">
  ) {
    this.channelId = channelId ?? "";
    this.guildId = guildId ?? "";
    this.queueMessageId = entry?.queueMessageId ?? "";
    this.url = entry?.url ?? "";
    this.seconds = entry?.seconds ?? 0;
    this.sentAt = entry?.sentAt ?? new Date();
    this.senderId = entry?.senderId ?? "";
    this.isDone = entry?.isDone ?? false;
  }
}
