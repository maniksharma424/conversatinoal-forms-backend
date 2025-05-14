// ConversationRepository.ts
import { Repository } from "typeorm";

import { AppDataSource } from "../config/data-source.js";
import { Conversation } from "../entities/conversationEntity.js";

export class ConversationRepository {
  private repository: Repository<Conversation>;

  constructor() {
    this.repository = AppDataSource.getRepository(Conversation);
  }

  async findById(id: string): Promise<Conversation | null> {
    return this.repository.findOne({
      where: { id },
      relations: ["messages", "formResponse", "formResponse.form"],
    });
  }

  async findByFormResponse(
    formResponseId: string
  ): Promise<Conversation | null> {
    return this.repository.findOne({
      where: {
        formResponse: {
          id: formResponseId,
        },
      },
      relations: {
        messages: true,
        formResponse: true,
      },
    });
  }

  async create(conversationData: Partial<Conversation>): Promise<Conversation> {
    const conversation = this.repository.create(conversationData);
    return this.repository.save(conversation);
  }

  async update(
    id: string,
    conversationData: Partial<Conversation>
  ): Promise<Conversation | null> {
    await this.repository.update(id, conversationData);
    return this.findById(id);
  }

  async complete(id: string): Promise<Conversation | null> {
    await this.repository.update(id, {
      status: "completed",
      endedAt: new Date(),
    });
    return this.findById(id);
  }

  async abandon(id: string): Promise<Conversation | null> {
    await this.repository.update(id, {
      status: "abandoned",
    });
    return this.findById(id);
  }

  async inProgress(id: string): Promise<Conversation | null> {
    await this.repository.update(id, {
      status: "in_progress",
    });
    return this.findById(id);
  }

  async getAllConversations(status?: string): Promise<Conversation[]> {
    const query = {
      where: status ? { status } : {}
      // relations: ["messages", "formResponse"],
    };
    return this.repository.find(query);
  }
}
