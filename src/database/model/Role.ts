import { Entity, Column, PrimaryColumn } from "typeorm";

@Entity()
export class Role {
  @PrimaryColumn({ unique: true })
  id: string;

  @Column()
  guildId: string;

  @Column()
  definesGuildAdmin: boolean;

  @Column()
  definesQueueAdmin: boolean;

  constructor(id: string, guildId: string);
  constructor(id?: string, guildId?: string) {
    this.id = id ?? "";
    this.guildId = guildId ?? "";
    this.definesGuildAdmin = false;
    this.definesQueueAdmin = false;
  }
}
