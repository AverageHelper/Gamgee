import { Sequelize, Model, ModelCtor, STRING, INTEGER } from "sequelize";
import { useLogger } from "../../../logger";

const logger = useLogger();

export interface QueueConfig {
  /** The maximum time in seconds that a new queue entry may take to play. */
  entryDurationSeconds: number | null;

  /** The number of seconds that a user must wait between successful queue submissions. */
  cooldownSeconds: number | null;
}

interface QueueConfigAttributes extends QueueConfig {
  /** The ID of the queue channel. */
  channelId: string;
}

type QueueConfigCreationAttributes = QueueConfigAttributes;

interface QueueConfigSchema
  extends Model<QueueConfigAttributes, QueueConfigCreationAttributes>,
    QueueConfigAttributes {}

export default function queueConfigSchema(sequelize: Sequelize): ModelCtor<QueueConfigSchema> {
  const QueueConfigs = sequelize.define<QueueConfigSchema>("queue-configs", {
    channelId: {
      type: STRING,
      unique: true,
      primaryKey: true,
      allowNull: false
    },
    entryDurationSeconds: INTEGER,
    cooldownSeconds: INTEGER
  });

  logger.debug("Created Queue Configs schema");
  return QueueConfigs;
}
