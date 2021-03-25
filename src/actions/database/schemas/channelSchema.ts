import { Model, ModelCtor, STRING } from "sequelize";
import { useLogger } from "../../../logger";
import { useSequelize } from "../useSequelize";

const logger = useLogger();

interface ChannelAttributes {
  id: string;
  guildId: string;
}

type ChannelCreationAttributes = ChannelAttributes;

interface ChannelSchema
  extends Model<ChannelAttributes, ChannelCreationAttributes>,
    ChannelAttributes {}

let Channels: ModelCtor<ChannelSchema> | null = null;

export default function channelSchema(): ModelCtor<ChannelSchema> {
  if (!Channels) {
    const sequelize = useSequelize();
    Channels = sequelize.define<ChannelSchema>("channels", {
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
    logger.debug("Created Channel schema");
  }

  return Channels;
}
