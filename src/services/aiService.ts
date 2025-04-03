import { generateText } from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { ENV } from "@/config/env.js";

export interface AIGenerationOptions {
  prompt: string;
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
  format?: "json" | "text" | "markdown";
  [key: string]: any;
}

export interface AIGenerationResponse {
  response: string;
  reasoning?: string;
  providerMetadata?: any;
}

export class AIService {
  private deepseekProvider: any;

  constructor() {
    this.deepseekProvider = createDeepSeek({
      apiKey: ENV.DEEPSEEK_API_KEY,
    });
  }

  public async generateText(
    options: AIGenerationOptions
  ): Promise<AIGenerationResponse> {
    const { prompt, temperature, systemPrompt, maxTokens, format, ...rest } =
      options;

    try {
      // Create the model
      const model = this.deepseekProvider(
        process.env.DEEPSEEK_MODEL || "deepseek-chat"
      );

      // Generate text
      const result = await generateText({
        model,
        prompt,
        system: systemPrompt,
        ...(temperature !== undefined ? { temperature } : {}),
        ...(maxTokens !== undefined ? { maxTokens } : {}),
        ...(format ? { format } : {}),
        ...rest,
      });

      return {
        response: result.text,
        reasoning: result.reasoning,
        providerMetadata: result.providerMetadata,
      };
    } catch (error) {
      console.error("Error generating text with DeepSeek:", error);
      throw new Error(
        `Failed to generate text: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
