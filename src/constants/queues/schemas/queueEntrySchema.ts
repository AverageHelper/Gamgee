import type { QueueEntry } from "../../../queueStorage";
import { Sequelize, Model, ModelCtor, STRING, INTEGER, DATE } from "sequelize";
import { useLogger } from "../../../logger";

const logger = useLogger();

interface QueueEntryAttributes extends QueueEntry {
  channelId: string;
  guildId: string;
}

type QueueEntryCreationAttributes = QueueEntryAttributes;

export interface QueueEntrySchema
  extends Model<QueueEntryAttributes, QueueEntryCreationAttributes>,
    QueueEntryAttributes {}

export default function queueEntrySchema(sequelize: Sequelize): ModelCtor<QueueEntrySchema> {
  const QueueEntries = sequelize.define<QueueEntrySchema>("queue-entries", {
    sentAt: {
      type: DATE,
      primaryKey: true,
      allowNull: false
    },
    senderId: {
      type: STRING,
      allowNull: false
    },
    queueMessageId: {
      type: STRING,
      unique: true,
      allowNull: false
    },
    url: {
      type: STRING,
      allowNull: false
    },
    seconds: {
      type: INTEGER,
      allowNull: false
    },
    channelId: {
      type: STRING,
      allowNull: false
    },
    guildId: {
      type: STRING,
      allowNull: false
    }
  });

  logger.debug("Created Queue Entries schema");
  return QueueEntries;
}
