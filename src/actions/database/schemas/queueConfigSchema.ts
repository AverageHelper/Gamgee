import { Model, ModelCtor, STRING, INTEGER } from "sequelize";
import { useLogger } from "../../../logger";
import { useSequelize } from "../useSequelize";

const logger = useLogger();

export interface QueueConfig {
  /** The maximum time in seconds that a new queue entry may take to play. */
  entryDurationSeconds: number | null;

  /** The number of seconds that a user must wait between successful queue submissions. */
  cooldownSeconds: number | null;

  /** The maximum number of successfu; submissions each user may have in the queue. */
  submissionMaxQuantity: number | null;
}

interface QueueConfigAttributes extends QueueConfig {
  /** The ID of the queue channel. */
  channelId: string;
}

type QueueConfigCreationAttributes = QueueConfigAttributes;

interface QueueConfigSchema
  extends Model<QueueConfigAttributes, QueueConfigCreationAttributes>,
    QueueConfigAttributes {}

let QueueConfigs: ModelCtor<QueueConfigSchema> | null = null;

export default function queueConfigSchema(): ModelCtor<QueueConfigSchema> {
  if (!QueueConfigs) {
    const sequelize = useSequelize();
    QueueConfigs = sequelize.define<QueueConfigSchema>("queue-configs", {
      channelId: {
        type: STRING,
        unique: true,
        primaryKey: true,
        allowNull: false
      },
      entryDurationSeconds: INTEGER,
      cooldownSeconds: INTEGER,
      submissionMaxQuantity: INTEGER
    });
    logger.debug("Created Queue Configs schema");
  }

  return QueueConfigs;
}
