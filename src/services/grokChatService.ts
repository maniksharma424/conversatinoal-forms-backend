import { ENV } from "@/config/env.js";
import fetch from "node-fetch";
import { Readable } from "stream"; // Import Node.js Readable stream

export class GrokService {
  private apiUrl = "https://api.x.ai/v1/chat/completions";
  private model = "grok-3";
  private apiKey: string = ENV.X_AI_API_KEY;

  // constructor(apiKey: string) {
  //   this.apiKey = apiKey;
  // }

  generateStreamText({
    messages,
    onChunk,
    onError,
    onFinish,
  }: {
    messages: { role: "user" | "system" | "assistant"; content: string }[];
    onChunk: (delta: string) => void;
    onError: (err: Error) => void;
    onFinish: () => void;
  }) {
    const stream = this.streamText({ messages, onChunk, onError, onFinish });
    return { textStream: stream };
  }

  private async *streamText({
    messages,
    onChunk,
    onError,
    onFinish,
  }: {
    messages: { role: "user" | "system" | "assistant"; content: string }[];
    onChunk: (delta: string) => void;
    onError: (err: Error) => void;
    onFinish: () => void;
  }): AsyncIterable<string> {

    
    try {
      const res = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: true,
          temperature: 0.5, // Adjust as needed
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Grok API error: ${res.status} ${res.statusText}`);
      }

      // Type res.body as a Node.js Readable stream
      const stream = res.body as Readable;
      let buffer = "";

      // Handle the Node.js Readable stream
      for await (const chunk of stream) {
        buffer += chunk.toString("utf-8");

        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep the last incomplete line in the buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data:")) continue;

          const jsonPart = trimmed.replace(/^data:\s*/, "");
          if (jsonPart === "[DONE]") {
            onFinish();
            return;
          }

          try {
            const parsed = JSON.parse(jsonPart);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              onChunk(delta);
              yield delta;
            }
          } catch (err) {
            console.warn("Stream parse error:", err);
            continue;
          }
        }
      }

      onFinish();
    } catch (err: any) {
      onError(err);
    }
  }

  async generateText({
    messages,
  }: {
    messages: { role: "user" | "system" | "assistant"; content: string }[];
  }): Promise<string> {
    try {
      const res = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.5, // Consistent with streamText
        }),
      });

      if (!res.ok) {
        throw new Error(`Grok API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("No content in response");
      }

      return content;
    } catch (err: any) {
      throw new Error(`Failed to generate text: ${err.message}`);
    }
  }
}
