// QuestionResponseRepository.ts
import { Repository } from "typeorm";

import { AppDataSource } from "../config/data-source.js";
import { QuestionResponse } from "../entities/questionResponse.js";

export class QuestionResponseRepository {
  private repository: Repository<QuestionResponse>;

  constructor() {
    this.repository = AppDataSource.getRepository(QuestionResponse);
  }

  async findById(id: string): Promise<QuestionResponse | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByFormResponse(
    formResponseId: string
  ): Promise<QuestionResponse[]> {
    return this.repository.find({
      where: { formResponse: { id: formResponseId } },
      relations: ["question"],
    });
  }

  async findByQuestionAndFormResponse(
    questionId: string,
    formResponseId: string
  ): Promise<QuestionResponse | null> {
    return this.repository.findOne({
      where: {
        question: { id: questionId },
        formResponse: { id: formResponseId },
      },
    });
  }

  async create(
    responseData: Partial<QuestionResponse>
  ): Promise<QuestionResponse> {
    const response = this.repository.create(responseData);
    return this.repository.save(response);
  }

  async update(
    id: string,
    responseData: Partial<QuestionResponse>
  ): Promise<QuestionResponse | null> {
    await this.repository.update(id, responseData);
    return this.findById(id);
  }

  async incrementRetryCount(id: string): Promise<QuestionResponse | null> {
    await this.repository.increment({ id }, "retryCount", 1);
    return this.findById(id);
  }
}
