/* eslint-disable unicorn/filename-case */
import type { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserBlacklist1619229105559 implements MigrationInterface {
	name = "AddUserBlacklist1619229105559";

	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`CREATE TABLE "user" ("id" varchar PRIMARY KEY NOT NULL)`);
		await queryRunner.query(
			`CREATE TABLE "queue-configs_blacklisted_users_user" ("queueConfigsChannelId" varchar NOT NULL, "userId" varchar NOT NULL, PRIMARY KEY ("queueConfigsChannelId", "userId"))`
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_101755e5cbc7377bb432f30d58" ON "queue-configs_blacklisted_users_user" ("queueConfigsChannelId") `
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_8b53ee35922cb113a6d3102124" ON "queue-configs_blacklisted_users_user" ("userId") `
		);
		await queryRunner.query(`DROP INDEX "IDX_101755e5cbc7377bb432f30d58"`);
		await queryRunner.query(`DROP INDEX "IDX_8b53ee35922cb113a6d3102124"`);
		await queryRunner.query(
			`CREATE TABLE "temporary_queue-configs_blacklisted_users_user" ("queueConfigsChannelId" varchar NOT NULL, "userId" varchar NOT NULL, CONSTRAINT "FK_101755e5cbc7377bb432f30d58d" FOREIGN KEY ("queueConfigsChannelId") REFERENCES "queue-configs" ("channelId") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_8b53ee35922cb113a6d3102124a" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, PRIMARY KEY ("queueConfigsChannelId", "userId"))`
		);
		await queryRunner.query(
			`INSERT INTO "temporary_queue-configs_blacklisted_users_user"("queueConfigsChannelId", "userId") SELECT "queueConfigsChannelId", "userId" FROM "queue-configs_blacklisted_users_user"`
		);
		await queryRunner.query(`DROP TABLE "queue-configs_blacklisted_users_user"`);
		await queryRunner.query(
			`ALTER TABLE "temporary_queue-configs_blacklisted_users_user" RENAME TO "queue-configs_blacklisted_users_user"`
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_101755e5cbc7377bb432f30d58" ON "queue-configs_blacklisted_users_user" ("queueConfigsChannelId") `
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_8b53ee35922cb113a6d3102124" ON "queue-configs_blacklisted_users_user" ("userId") `
		);
	}

	async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`DROP INDEX "IDX_8b53ee35922cb113a6d3102124"`);
		await queryRunner.query(`DROP INDEX "IDX_101755e5cbc7377bb432f30d58"`);
		await queryRunner.query(
			`ALTER TABLE "queue-configs_blacklisted_users_user" RENAME TO "temporary_queue-configs_blacklisted_users_user"`
		);
		await queryRunner.query(
			`CREATE TABLE "queue-configs_blacklisted_users_user" ("queueConfigsChannelId" varchar NOT NULL, "userId" varchar NOT NULL, PRIMARY KEY ("queueConfigsChannelId", "userId"))`
		);
		await queryRunner.query(
			`INSERT INTO "queue-configs_blacklisted_users_user"("queueConfigsChannelId", "userId") SELECT "queueConfigsChannelId", "userId" FROM "temporary_queue-configs_blacklisted_users_user"`
		);
		await queryRunner.query(`DROP TABLE "temporary_queue-configs_blacklisted_users_user"`);
		await queryRunner.query(
			`CREATE INDEX "IDX_8b53ee35922cb113a6d3102124" ON "queue-configs_blacklisted_users_user" ("userId") `
		);
		await queryRunner.query(
			`CREATE INDEX "IDX_101755e5cbc7377bb432f30d58" ON "queue-configs_blacklisted_users_user" ("queueConfigsChannelId") `
		);
		await queryRunner.query(`DROP INDEX "IDX_8b53ee35922cb113a6d3102124"`);
		await queryRunner.query(`DROP INDEX "IDX_101755e5cbc7377bb432f30d58"`);
		await queryRunner.query(`DROP TABLE "queue-configs_blacklisted_users_user"`);
		await queryRunner.query(`DROP TABLE "user"`);
	}
}
