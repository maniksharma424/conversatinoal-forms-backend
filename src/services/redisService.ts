// src/services/redisService.ts
import { createClient } from "redis";

export class RedisService {
  private client;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || "redis://localhost:6379",
    });

    this.client
      .connect()
      .then((client) => console.log("redis connected"))
      .catch((err) => {
        console.error("Redis connection error:", err);
      });
  }

  // Cache form data with questions
  async cacheForm(formId: string, formData: any) {
    const key = `form:${formId}`;
    await this.client.set(key, JSON.stringify(formData), {
      EX: 3600, // Cache for 1 hour
    });
  }

  // Get cached form data
  async getCachedForm(formId: string) {
    const key = `form:${formId}`;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  // Cache conversation messages
  async cacheConversationMessages(conversationId: string, messages: any[]) {
    const key = `conversation:${conversationId}:messages`;
    await this.client.set(key, JSON.stringify(messages), {
      EX: 1800, // Cache for 30 minutes
    });
  }

  // Get cached conversation messages
  async getConversationMessages(conversationId: string) {
    const key = `conversation:${conversationId}:messages`;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  // Add a message to cached conversation messages
  async addMessageToCache(conversationId: string, message: any) {
    const key = `conversation:${conversationId}:messages`;
    const messagesStr = await this.client.get(key);

    if (messagesStr) {
      const messages = JSON.parse(messagesStr);
      messages.push(message);

      await this.client.set(key, JSON.stringify(messages), {
        EX: 1800, // Reset expiration to 30 minutes
      });
    }
  }
}
