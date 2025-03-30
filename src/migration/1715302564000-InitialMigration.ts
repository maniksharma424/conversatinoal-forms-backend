import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1715302564000 implements MigrationInterface {
  name = "InitialMigration1715302564000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create extension for UUID generation
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create User table
    await queryRunner.query(`
            CREATE TABLE "user" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "email" varchar NOT NULL UNIQUE,
                "passwordHash" varchar NOT NULL,
                "firstName" varchar NOT NULL,
                "lastName" varchar NOT NULL,
                "isVerified" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);

    // Create Form table
    await queryRunner.query(`
            CREATE TABLE "form" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "title" varchar NOT NULL,
                "description" text NOT NULL,
                "tone" varchar NOT NULL DEFAULT 'neutral',
                "isPublished" boolean NOT NULL DEFAULT false,
                "publishedUrl" varchar NULL,
                "maxRetries" integer NOT NULL DEFAULT 3,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "settings" jsonb NULL,
                "userId" uuid NOT NULL,
                CONSTRAINT "FK_form_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE
            )
        `);

    // Create Question table
    await queryRunner.query(`
            CREATE TABLE "question" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "text" text NOT NULL,
                "type" varchar NOT NULL DEFAULT 'text',
                "validationRules" jsonb NULL,
                "order" integer NOT NULL DEFAULT 0,
                "metadata" jsonb NULL,
                "formId" uuid NOT NULL,
                CONSTRAINT "FK_question_form" FOREIGN KEY ("formId") REFERENCES "form"("id") ON DELETE CASCADE
            )
        `);

    // Create Conversation table
    await queryRunner.query(`
            CREATE TABLE "conversation" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "startedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "endedAt" TIMESTAMP NULL,
                "status" varchar NOT NULL DEFAULT 'in_progress'
            )
        `);

    // Create FormResponse table
    await queryRunner.query(`
            CREATE TABLE "form_response" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "respondentEmail" varchar NULL,
                "respondentName" varchar NULL,
                "startedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "completedAt" TIMESTAMP NULL,
                "formId" uuid NOT NULL,
                "conversationId" uuid NULL,
                CONSTRAINT "FK_form_response_form" FOREIGN KEY ("formId") REFERENCES "form"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_form_response_conversation" FOREIGN KEY ("conversationId") REFERENCES "conversation"("id") ON DELETE SET NULL,
                CONSTRAINT "UQ_form_response_conversation" UNIQUE ("conversationId")
            )
        `);

    // Create QuestionResponse table
    await queryRunner.query(`
            CREATE TABLE "question_response" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "response" text NOT NULL,
                "retryCount" integer NOT NULL DEFAULT 0,
                "questionId" uuid NOT NULL,
                "formResponseId" uuid NOT NULL,
                CONSTRAINT "FK_question_response_question" FOREIGN KEY ("questionId") REFERENCES "question"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_question_response_form_response" FOREIGN KEY ("formResponseId") REFERENCES "form_response"("id") ON DELETE CASCADE
            )
        `);

    // Create ConversationMessage table
    await queryRunner.query(`
            CREATE TABLE "conversation_message" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "content" text NOT NULL,
                "role" varchar NOT NULL,
                "timestamp" TIMESTAMP NOT NULL DEFAULT now(),
                "questionId" varchar NULL,
                "conversationId" uuid NOT NULL,
                CONSTRAINT "FK_conversation_message_conversation" FOREIGN KEY ("conversationId") REFERENCES "conversation"("id") ON DELETE CASCADE
            )
        `);

    // Create indexes for better performance
    await queryRunner.query(
      `CREATE INDEX "IDX_form_user" ON "form" ("userId")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_question_form" ON "question" ("formId")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_form_response_form" ON "form_response" ("formId")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_question_response_question" ON "question_response" ("questionId")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_question_response_form_response" ON "question_response" ("formResponseId")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_conversation_message_conversation" ON "conversation_message" ("conversationId")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order to avoid foreign key constraint errors
    await queryRunner.query(
      `DROP INDEX "IDX_conversation_message_conversation"`
    );
    await queryRunner.query(`DROP INDEX "IDX_question_response_form_response"`);
    await queryRunner.query(`DROP INDEX "IDX_question_response_question"`);
    await queryRunner.query(`DROP INDEX "IDX_form_response_form"`);
    await queryRunner.query(`DROP INDEX "IDX_question_form"`);
    await queryRunner.query(`DROP INDEX "IDX_form_user"`);

    await queryRunner.query(`DROP TABLE "conversation_message"`);
    await queryRunner.query(`DROP TABLE "question_response"`);
    await queryRunner.query(`DROP TABLE "form_response"`);
    await queryRunner.query(`DROP TABLE "conversation"`);
    await queryRunner.query(`DROP TABLE "question"`);
    await queryRunner.query(`DROP TABLE "form"`);
    await queryRunner.query(`DROP TABLE "user"`);
  }
}
