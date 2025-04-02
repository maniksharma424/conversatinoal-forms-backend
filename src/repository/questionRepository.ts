// QuestionRepository.ts
import { Repository } from "typeorm";

import { AppDataSource } from "../config/data-source.js";
import { Question } from "../entities/questionEntity.js";

export class QuestionRepository {
  private repository: Repository<Question>;

  constructor() {
    this.repository = AppDataSource.getRepository(Question);
  }

  async findById(id: string): Promise<Question | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByForm(formId: string): Promise<Question[]> {
    return this.repository.find({
      where: { form: { id: formId } },
      order: { order: "ASC" },
    });
  }

  async create(questionData: Partial<Question>): Promise<Question> {
    const question = this.repository.create(questionData);
    return this.repository.save(question);
  }

  async update(
    id: string,
    questionData: Partial<Question>
  ): Promise<Question | null> {
    await this.repository.update(id, questionData);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return !!result.affected && result.affected > 0;
  }

  async reorder(formId: string, questionIds: string[]): Promise<boolean> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (let i = 0; i < questionIds.length; i++) {
        await queryRunner.manager.update(Question, questionIds[i], {
          order: i,
        });
      }

      await queryRunner.commitTransaction();
      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      return false;
    } finally {
      await queryRunner.release();
    }
  }
}
