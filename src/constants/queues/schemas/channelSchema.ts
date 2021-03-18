import { Sequelize, Model, ModelCtor, STRING } from "sequelize";
import queueEntrySchema from "./queueEntrySchema";
import { useLogger } from "../../../logger";

const logger = useLogger();

interface ChannelAttributes {
  id: string;
  guildId: string;
}

type ChannelCreationAttributes = ChannelAttributes;

interface ChannelSchema
  extends Model<ChannelAttributes, ChannelCreationAttributes>,
    ChannelAttributes {}

export default function channelSchema(sequelize: Sequelize): ModelCtor<ChannelSchema> {
  const GuildEntries = queueEntrySchema(sequelize);

  const Channels = sequelize.define<ChannelSchema>("channels", {
    id: {
      type: STRING,
      primaryKey: true,
      unique: true,
      allowNull: false
    },
    guildId: {
      type: STRING,
      allowNull: false
    }
  });

  Channels.hasMany(GuildEntries, { sourceKey: "id", foreignKey: "channelId", as: "entries" });
  GuildEntries.belongsTo(Channels, { targetKey: "id" });

  logger.debug("Created Channel schema");
  return Channels;
}
