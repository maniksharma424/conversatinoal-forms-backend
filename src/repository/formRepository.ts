// FormRepository.ts
import { Repository } from "typeorm";

import { AppDataSource } from "../config/data-source.js";
import { Form } from "../entities/formEntity.js";
import { Question } from "@/entities/questionEntity.js";

export class FormRepository {
  private repository: Repository<Form>;

  constructor() {
    this.repository = AppDataSource.getRepository(Form);
  }

  async findById(id: string, isPublic = false): Promise<Form | null> {
    const queryOptions: any = {
      where: { id },
    };

    // Only include questions and publishedVersion relation if not public
    if (!isPublic) {
      queryOptions.relations = ["questions", "publishedVersion"];
    }

    // If public, select all columns except userId
    if (isPublic) {
      queryOptions.select = [
        "id",
        "title",
        "description",
        "tone",
        "isPublished",
        "publishedUrl",
        "createdAt",
        "updatedAt",
      ];
    }

    return this.repository.findOne(queryOptions);
  }

  async findByUser(userId: string): Promise<Form[]> {
    return this.repository.find({
      // user will always interact with non published form
      where: { user: { id: userId }, isPublished: false },
      order: { createdAt: "DESC" },
    });
  }

  async findPublishedForm(publishedUrl: string): Promise<Form | null> {
    return this.repository.findOne({
      where: { publishedUrl, isPublished: true },
      relations: ["questions"],
    });
  }

  async create(formData: Partial<Form>): Promise<Form> {
    const form = this.repository.create(formData);
    return this.repository.save(form);
  }

  async update(id: string, formData: Partial<Form>): Promise<Form | null> {
    await this.repository.update(id, formData);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return !!result.affected && result.affected > 0;
  }

  async publish(id: string): Promise<Form | null> {
    // Start a transaction
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    const questionRepository = AppDataSource.getRepository(Question);

    try {
      // Get the draft form with its questions
      const draftForm = await queryRunner.manager.findOne(Form, {
        where: { id },
        relations: ["questions"],
      });

      if (!draftForm) {
        throw new Error("Draft form not found");
      }

      if (draftForm.isPublished) {
        throw new Error("Cannot publish a form that is already published");
      }

      // Form properties to copy
      const formProperties = {
        title: draftForm.title,
        description: draftForm.description,
        tone: draftForm.tone,
        maxRetries: draftForm.maxRetries,
        settings: draftForm.settings,
        userId: draftForm.userId,
        isPublished: true,
      };

      let publishedForm: Form | null;

      // Check if we're updating an existing published form
      if (draftForm.publishedVersionId) {
        await queryRunner.manager.update(
          Form,
          draftForm.publishedVersionId,
          formProperties
        );

        // Delete all existing questions from the published form
        await queryRunner.manager.delete(Question, {
          formId: draftForm.publishedVersionId,
        });

        publishedForm = await queryRunner.manager.findOne(Form, {
          where: { id: draftForm.publishedVersionId },
        });
      }
      // Creating a new published version
      else {
        const newPublishedForm = this.repository.create(formProperties);
        publishedForm = await queryRunner.manager.save(newPublishedForm);
        await queryRunner.manager.update(Form, publishedForm.id, {
          publishedUrl: `form-${publishedForm.id}`,
        });

        draftForm.publishedVersionId = publishedForm.id;
        await queryRunner.manager.save(draftForm);
      }

      // Copy all questions from draft to published form
      for (const question of draftForm.questions) {
        const newQuestion = questionRepository.create({
          text: question.text,
          type: question.type,
          validationRules: question.validationRules,
          metadata: question.metadata,
          order: question.order,
          formId: publishedForm?.id,
        });

        await queryRunner.manager.save(newQuestion);
      }

      await queryRunner.commitTransaction();

      return this.findById(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async unpublish(id: string): Promise<Form | null> {
    // Start a transaction
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find the draft form
      const draftForm = await queryRunner.manager.findOne(Form, {
        where: { id },
        relations: ["questions"],
      });

      if (!draftForm) {
        throw new Error("Form not found");
      }

      // Check if this form has a published version
      if (draftForm.publishedVersionId) {
        // Delete all questions from the published form
        await queryRunner.manager.delete(Question, {
          formId: draftForm.publishedVersionId,
        });

        // Delete the published form
        await queryRunner.manager.delete(Form, draftForm.publishedVersionId);

        // Remove the reference to the published version
        await queryRunner.manager.update(Form, draftForm.id, {
          publishedVersionId: undefined,
        });
      }

      await queryRunner.commitTransaction();
      return this.findById(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
