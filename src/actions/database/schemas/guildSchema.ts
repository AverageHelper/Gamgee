import { Sequelize, Model, ModelCtor, STRING, BOOLEAN } from "sequelize";
import channelSchema from "./channelSchema";
import { useLogger } from "../../../logger";

const logger = useLogger();

export interface GuildAttributes {
  id: string;
  isQueueOpen: boolean;
  currentQueue: string | null;
}

type GuildCreationAttributes = GuildAttributes;

interface GuildSchema extends Model<GuildAttributes, GuildCreationAttributes>, GuildAttributes {}

export default function guildSchema(sequelize: Sequelize): ModelCtor<GuildSchema> {
  const Channels = channelSchema(sequelize);

  const Guilds = sequelize.define<GuildSchema>("guilds", {
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

  Guilds.hasMany(Channels, { sourceKey: "id", foreignKey: "guildId", as: "channels" });
  Channels.belongsTo(Guilds);

  logger.debug("Created Guilds schema");
  return Guilds;
}
