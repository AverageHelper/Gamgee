import type { QueueEntry } from "../../../queueStorage";
import type { Model, ModelCtor } from "sequelize";
import { STRING, INTEGER, DATE, BOOLEAN } from "sequelize";
import { useLogger } from "../../../logger";
import { useSequelize } from "../useSequelize";

const logger = useLogger();

interface QueueEntryAttributes extends QueueEntry {
  channelId: string;
  guildId: string;
}

type QueueEntryCreationAttributes = QueueEntryAttributes;

export interface QueueEntrySchema
  extends Model<QueueEntryAttributes, QueueEntryCreationAttributes>,
    QueueEntryAttributes {}

let QueueEntries: ModelCtor<QueueEntrySchema> | null = null;

export default function queueEntrySchema(): ModelCtor<QueueEntrySchema> {
  if (!QueueEntries) {
    const sequelize = useSequelize();
    QueueEntries = sequelize.define<QueueEntrySchema>("queue-entries", {
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
      },
      isDone: {
        type: BOOLEAN,
        allowNull: false
      }
    });
    logger.debug("Created Queue Entries schema");
  }

  return QueueEntries;
}
