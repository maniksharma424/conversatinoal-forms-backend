import { generateText, streamText } from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { ENV } from "@/config/env.js";

export interface AIGenerationOptions {
  prompt: string;
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
  format?: "json" | "text" | "markdown";
  toolChoice?: "auto" | "none" | "required";
  [key: string]: any;
}

export interface AIGenerationResponse {
  response: string;
  reasoning?: string;
  providerMetadata?: any;
}

export interface AIStreamOptions extends AIGenerationOptions {
  onChunk?: (chunk: any) => void;
  onError?: (error: any) => void;
  onFinish?: (data: any) => void;
}

export class AIService {
  private deepseekProvider: any;
  public model: any;

  constructor() {
    this.deepseekProvider = createDeepSeek({
      apiKey: ENV.DEEPSEEK_API_KEY,
    });
    // Create the model
    this.model = this.deepseekProvider(
      process.env.DEEPSEEK_MODEL || "deepseek-chat"
    );
  }

  public async generateText(
    options: AIGenerationOptions
  ): Promise<AIGenerationResponse> {
    const { prompt, temperature, systemPrompt, maxTokens, format, ...rest } =
      options;

    try {
      const model = this.model;
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

  public generateStreamText(options: AIStreamOptions) {
    const {
      prompt,
      temperature,
      systemPrompt,
      maxTokens,
      format,
      onChunk,
      onError,
      onFinish,
      toolChoice,

      ...rest
    } = options;

    try {
      // Create the model
      const model = this.model;
      // Stream text
      const result = streamText({
        model,
        prompt,
        system: systemPrompt,
        ...(temperature !== undefined ? { temperature } : {}),
        ...(maxTokens !== undefined ? { maxTokens } : {}),
        ...(format ? { format } : {}),
        onChunk: onChunk ? ({ chunk }) => onChunk(chunk) : undefined,
        onError: onError ? ({ error }) => onError(error) : undefined,
        onFinish: onFinish ? (data) => onFinish(data) : undefined,
        toolChoice: toolChoice ? toolChoice : undefined,
        ...rest,
      });

      return {
        textStream: result.textStream,
        fullStream: result.fullStream,
        textPromise: result.text,
        toResponse: (res: any) => result.pipeTextStreamToResponse(res),
        stopStream: () => {
          // This method would handle any cleanup needed when stopping the stream
        },
      };
    } catch (error) {
      console.error("Error streaming text with DeepSeek:", error);
      throw new Error(
        `Failed to stream text: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
