import {MigrationInterface, QueryRunner} from "typeorm";

export class addQueueDurationLimit1650745980666 implements MigrationInterface {
    name = 'addQueueDurationLimit1650745980666'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "temporary_queue-configs" ("channelId" varchar PRIMARY KEY NOT NULL, "entryDurationSeconds" integer, "cooldownSeconds" integer, "submissionMaxQuantity" integer, "queueDurationSeconds" integer)`);
        await queryRunner.query(`INSERT INTO "temporary_queue-configs"("channelId", "entryDurationSeconds", "cooldownSeconds", "submissionMaxQuantity") SELECT "channelId", "entryDurationSeconds", "cooldownSeconds", "submissionMaxQuantity" FROM "queue-configs"`);
        await queryRunner.query(`DROP TABLE "queue-configs"`);
        await queryRunner.query(`ALTER TABLE "temporary_queue-configs" RENAME TO "queue-configs"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "queue-configs" RENAME TO "temporary_queue-configs"`);
        await queryRunner.query(`CREATE TABLE "queue-configs" ("channelId" varchar PRIMARY KEY NOT NULL, "entryDurationSeconds" integer, "cooldownSeconds" integer, "submissionMaxQuantity" integer)`);
        await queryRunner.query(`INSERT INTO "queue-configs"("channelId", "entryDurationSeconds", "cooldownSeconds", "submissionMaxQuantity") SELECT "channelId", "entryDurationSeconds", "cooldownSeconds", "submissionMaxQuantity" FROM "temporary_queue-configs"`);
        await queryRunner.query(`DROP TABLE "temporary_queue-configs"`);
    }

}
