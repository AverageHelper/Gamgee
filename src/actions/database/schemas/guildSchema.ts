import type { Model, ModelCtor } from "sequelize";
import { STRING, BOOLEAN } from "sequelize";
import { useLogger } from "../../../logger";
import { useSequelize } from "../useSequelize";

const logger = useLogger();

export interface GuildAttributes {
  id: string;
  isQueueOpen: boolean;
  currentQueue: string | null;
}

type GuildCreationAttributes = GuildAttributes;

interface GuildSchema extends Model<GuildAttributes, GuildCreationAttributes>, GuildAttributes {}

let Guilds: ModelCtor<GuildSchema> | null = null;

export default function guildSchema(): ModelCtor<GuildSchema> {
  if (!Guilds) {
    const sequelize = useSequelize();
    Guilds = sequelize.define<GuildSchema>("guilds", {
      id: {
        type: STRING,
        primaryKey: true,
        unique: true,
        allowNull: false
      },
      isQueueOpen: {
        type: BOOLEAN,
        allowNull: false
      },
      currentQueue: STRING
    });
    logger.debug("Created Guilds schema");
  }

  return Guilds;
}
