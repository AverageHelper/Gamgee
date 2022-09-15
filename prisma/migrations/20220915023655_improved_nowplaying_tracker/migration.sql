/*
  Warnings:

  - You are about to drop the column `haveCalledNowPlaying` on the `queue-entries` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "_QueueEntryToUser" (
    "A" DATETIME NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_QueueEntryToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "queue-entries" ("sentAt") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_QueueEntryToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_guilds" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "isQueueOpen" BOOLEAN NOT NULL,
    "currentQueue" TEXT,
    "messageCommandPrefix" TEXT
);
INSERT INTO "new_guilds" ("currentQueue", "id", "isQueueOpen", "messageCommandPrefix") SELECT "currentQueue", "id", "isQueueOpen", "messageCommandPrefix" FROM "guilds";
DROP TABLE "guilds";
ALTER TABLE "new_guilds" RENAME TO "guilds";
CREATE TABLE "new_queue-entries" (
    "channelId" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "queueMessageId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "seconds" INTEGER NOT NULL,
    "sentAt" DATETIME NOT NULL PRIMARY KEY,
    "senderId" TEXT NOT NULL,
    "isDone" BOOLEAN NOT NULL
);
INSERT INTO "new_queue-entries" ("channelId", "guildId", "isDone", "queueMessageId", "seconds", "senderId", "sentAt", "url") SELECT "channelId", "guildId", "isDone", "queueMessageId", "seconds", "senderId", "sentAt", "url" FROM "queue-entries";
DROP TABLE "queue-entries";
ALTER TABLE "new_queue-entries" RENAME TO "queue-entries";
Pragma writable_schema=1;
CREATE UNIQUE INDEX "sqlite_autoindex_queue-entries_2" ON "queue-entries"("queueMessageId");
Pragma writable_schema=0;
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "_QueueEntryToUser_AB_unique" ON "_QueueEntryToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_QueueEntryToUser_B_index" ON "_QueueEntryToUser"("B");
