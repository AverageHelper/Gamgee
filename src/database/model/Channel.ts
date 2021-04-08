import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity({ name: "channels" })
export class Channel {
  @PrimaryColumn({ unique: true, nullable: false })
  id: string;

  @Column({ nullable: false })
  guildId: string;

  constructor(id: string, guildId: string) {
    this.id = id;
    this.guildId = guildId;
  }
}
