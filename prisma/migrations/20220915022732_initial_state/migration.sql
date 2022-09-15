-- CreateTable
CREATE TABLE "channels" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guildId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "guilds" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "isQueueOpen" BOOLEAN NOT NULL,
    "currentQueue" TEXT,
    "messageCommandPrefix" TEXT NOT NULL DEFAULT '?'
);

-- CreateTable
CREATE TABLE "queue-configs" (
    "channelId" TEXT NOT NULL PRIMARY KEY,
    "entryDurationSeconds" INTEGER,
    "cooldownSeconds" INTEGER,
    "submissionMaxQuantity" INTEGER,
    "queueDurationSeconds" INTEGER,
    "entryDurationMinSeconds" INTEGER
);

-- CreateTable
CREATE TABLE "queue-configs_blacklisted_users_user" (
    "queueConfigsChannelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    PRIMARY KEY ("queueConfigsChannelId", "userId"),
    CONSTRAINT "queue-configs_blacklisted_users_user_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "queue-configs_blacklisted_users_user_queueConfigsChannelId_fkey" FOREIGN KEY ("queueConfigsChannelId") REFERENCES "queue-configs" ("channelId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "queue-entries" (
    "channelId" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "queueMessageId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "seconds" INTEGER NOT NULL,
    "sentAt" DATETIME NOT NULL PRIMARY KEY,
    "senderId" TEXT NOT NULL,
    "isDone" BOOLEAN NOT NULL,
    "haveCalledNowPlaying" TEXT
);

-- CreateTable
CREATE TABLE "role" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "guildId" TEXT NOT NULL,
    "definesGuildAdmin" BOOLEAN NOT NULL,
    "definesQueueAdmin" BOOLEAN NOT NULL
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL PRIMARY KEY
);

-- CreateIndex
CREATE INDEX "IDX_101755e5cbc7377bb432f30d58" ON "queue-configs_blacklisted_users_user"("queueConfigsChannelId");

-- CreateIndex
CREATE INDEX "IDX_8b53ee35922cb113a6d3102124" ON "queue-configs_blacklisted_users_user"("userId");

-- CreateIndex
Pragma writable_schema=1;
CREATE UNIQUE INDEX "sqlite_autoindex_queue-entries_2" ON "queue-entries"("queueMessageId");
Pragma writable_schema=0;
