// ConversationMessageRepository.ts
import { Repository } from "typeorm";

import { AppDataSource } from "../config/data-source.js";
import { ConversationMessage } from "../entities/conversationMessageEntity.js";


export class ConversationMessageRepository {
  private repository: Repository<ConversationMessage>;

  constructor() {
    this.repository = AppDataSource.getRepository(ConversationMessage);
  }

  async findById(id: string): Promise<ConversationMessage | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByConversation(
    conversationId: string
  ): Promise<ConversationMessage[]> {
    return this.repository.find({
      where: { conversation: { id: conversationId } },
      order: { timestamp: "ASC" },
    });
  }

  async create(
    messageData: Partial<ConversationMessage>
  ): Promise<ConversationMessage> {
    const message = this.repository.create(messageData);
    return this.repository.save(message);
  }

  async findLastMessageByRole(
    conversationId: string,
    role: string
  ): Promise<ConversationMessage | null> {
    return this.repository.findOne({
      where: {
        conversation: { id: conversationId },
        role,
      },
      order: { timestamp: "DESC" },
    });
  }
}
