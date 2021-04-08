import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity({ name: "queue-entries" })
export class QueueEntry {
  @Column({ nullable: false })
  channelId: string;

  @Column({ nullable: false })
  guildId: string;

  @Column({ unique: true, nullable: false })
  queueMessageId: string;

  @Column({ nullable: false })
  url: string;

  @Column({ type: "integer", nullable: false })
  seconds: number;

  @PrimaryColumn({ nullable: false })
  sentAt: Date;

  @Column({ nullable: false })
  senderId: string;

  @Column({ nullable: false })
  isDone: boolean;

  constructor(
    channelId: string,
    guildId: string,
    queueMessageId: string,
    url: string,
    seconds: number,
    sentAt: Date,
    senderId: string,
    isDone: boolean
  ) {
    this.channelId = channelId;
    this.guildId = guildId;
    this.queueMessageId = queueMessageId;
    this.url = url;
    this.seconds = seconds;
    this.sentAt = sentAt;
    this.senderId = senderId;
    this.isDone = isDone;
  }
}
