// FormResponseRepository.ts
import { IsNull, Not, Repository } from "typeorm";

import { AppDataSource } from "../config/data-source";
import { FormResponse } from "../entities/formResponseEntity";

export class FormResponseRepository {
  private repository: Repository<FormResponse>;

  constructor() {
    this.repository = AppDataSource.getRepository(FormResponse);
  }

  async findById(id: string): Promise<FormResponse | null> {
    return this.repository.findOne({
      where: { id },
      relations: ["questionResponses", "questionResponses.question"],
    });
  }

  async findByForm(formId: string): Promise<FormResponse[]> {
    return this.repository.find({
      where: { form: { id: formId } },
      relations: ["questionResponses"],
      order: { startedAt: "DESC" },
    });
  }

  async create(responseData: Partial<FormResponse>): Promise<FormResponse> {
    const response = this.repository.create(responseData);
    return this.repository.save(response);
  }

  async update(
    id: string,
    responseData: Partial<FormResponse>
  ): Promise<FormResponse | null> {
    await this.repository.update(id, responseData);
    return this.findById(id);
  }

  async complete(id: string): Promise<FormResponse | null> {
    await this.repository.update(id, {
      completedAt: new Date(),
    });
    return this.findById(id);
  }

  async getResponseStats(formId: string): Promise<any> {
    // This would implement specific analytics queries
    // Return counts, completion rates, etc.
    const total = await this.repository.count({
      where: { form: { id: formId } },
    });

    const completed = await this.repository.count({
      where: {
        form: { id: formId },
        completedAt: Not(IsNull()),
      },
    });

    return {
      total,
      completed,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
    };
  }
}
