// src/services/conversationService.ts

import { AIService } from "./aiService.js";
import { Response } from "express";

import { z } from "zod";
import { tool } from "ai";
import { FormRepository } from "@/repository/formRepository.js";
import { ConversationRepository } from "@/repository/conversationRepository.js";
import { ConversationMessageRepository } from "@/repository/conversationMessageRepository.js";
import { FormResponseRepository } from "@/repository/formResponseRepository.js";
import { QuestionResponseRepository } from "@/repository/questionResponseRepository.js";
import { RedisService } from "./redisService.js";
import { generateChatPrompt } from "@/utils/prompts.js";
import { Conversation } from "@/entities/conversationEntity.js";
import { FormResponse } from "@/entities/formResponseEntity.js";
import { AppDataSource } from "@/config/data-source.js";
import {
  generateSessionToken,
} from "@/utils/jwtSession.js";
import { ConversationMessage } from "@/entities/conversationMessageEntity.js";

export interface RespondDTO {
  response: string;
}

interface ChatProps {
  formId: string;
  conversationId?: string;
  question?: string;
  answer?: string;
  res: Response;
}

export class ConversationService {
  private formRepository: FormRepository;
  private conversationRepository: ConversationRepository;
  private conversationMessageRepository: ConversationMessageRepository;
  private formResponseRepository: FormResponseRepository;
  private questionResponseRepository: QuestionResponseRepository;
  private aiService: AIService;
  private redisService: RedisService;

  constructor() {
    this.formRepository = new FormRepository();
    this.conversationRepository = new ConversationRepository();
    this.conversationMessageRepository = new ConversationMessageRepository();
    this.formResponseRepository = new FormResponseRepository();
    this.questionResponseRepository = new QuestionResponseRepository();
    this.aiService = new AIService();
    this.redisService = new RedisService();

    // Initialize tools once during service creation
    const tools = this.createConversationTools();
  }

  async chat({
    formId,
    conversationId,
    question,
    answer,
    res,
  }: ChatProps): Promise<void> {
    console.log("starting chat ..");
    // Set up SSE headers
    this.setupSSEHeaders(res);

    try {
      let chatPrompt: string;
      let form;
      let currentQuestion;
      let messages;
      let conversation: Conversation;
      let fullMessage = ""; // Variable to collect the complete message
      // Get form data (common to both cases)
      form = await this.getFormWithCache(formId);

      // CASE 1: Starting a new conversation (no conversationId provided)
      if (!conversationId) {
        const formResponse = new FormResponse();
        formResponse.formId = form.id;

        // Save the conversation (which will also save the form response with cascade)
        conversation = await this.conversationRepository.create({
          status: "in_progress",
          formResponse,
        });

        console.log("creating new form response ", formResponse);
        console.log(
          "creating conversation for new form response ",
          conversation
        );

        // Current question is the first question
        currentQuestion = form.questions[0];

        // Send metadata
        this.sendSSEEvent(res, "metadata", {
          conversationId: conversation.id,
          formId: form.id,
          sessionToken: generateSessionToken(
            form.id,
            conversation.formResponse.id
          ),
        });

        // Generate prompt with first question
        chatPrompt = generateChatPrompt(
          conversation.id,
          form,
          currentQuestion.text
        );
      }
      // CASE 2: Continuing an existing conversation
      else {
        // Verify conversation exists and is active
        const conversation = await this.conversationRepository.findById(
          conversationId
        );

        if (!conversation || conversation.status !== "in_progress") {
          throw new Error("Conversation not found or not active");
        }

        // Save user's answer as conversation message
        if (answer && answer.trim()) {
          const userMessage = await this.conversationMessageRepository.create({
            conversationId,
            content: answer,
            role: "user",
          });
          console.log(
            "SAVED USER ANSWER IN conversation messages ",
            userMessage
          );
          // Update cache
          //   await this.redisService.addMessageToCache(conversationId, newMessage);
        }

        // Get conversation messages with caching
        // const cachedMessagesStr =
        //   await this.redisService.getConversationMessages(conversationId);

        // if (!cachedMessagesStr) {
        messages = await this.conversationMessageRepository.findByConversation(
          conversationId
        );

        //   await this.redisService.cacheConversationMessages(
        //     conversation.id,
        //     messages
        //   );
        // } else {
        //   messages = JSON.parse(cachedMessagesStr);
        // }

        // Generate system prompt
        chatPrompt = generateChatPrompt(
          conversationId,
          form,
          question!,
          messages,
          answer
        );
      }

      const stream = this.aiService.generateStreamText({
        prompt: chatPrompt,
        systemPrompt:
          "You are a helpful, conversational assistant guiding users through the form",
        temperature: 0.7,
        maxSteps: 2, // Allow one tool call plus a final response
        tools: {
          completeForm: this.createConversationTools().formCompletionTool,
        },
        toolChoice: "auto", // Let the model decide when to call the tool

        onChunk: (chunk) => {
          if (chunk.type === "text-delta") {
            fullMessage += chunk.textDelta;
          }
        },
        onError: (error) => {
          console.error("Stream error:", error);
          this.sendSSEEvent(res, "error", {
            error: "Error generating welcome message",
          });
        },
        onFinish: async () => {
          // Send completion event
          try {
            const message = await this.conversationMessageRepository.create({
              content: fullMessage,
              role: "assistant",
              conversationId: conversationId || conversation.id,
            });
            console.log(
              "SAVED assistant message in conversation messages",
              message
            );
            // Update the message cache
            // await this.redisService.addMessageToCache(
            //   conversationId || conversation.id,
            //   message
            // );

            this.sendSSEEvent(res, "end", { success: true, complete: true });
            res.end();
          } catch (error) {
            console.error("Error saving message:", error);
            return {
              success: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to save message",
            };
          }
        },
      });

      // Process the stream for async iteration compatibility
      for await (const textPart of stream.textStream) {
        // this.sendSSEEvent(res, "data", { text: textPart });
        res.write(`data: ${JSON.stringify({ text: textPart })}\n\n`);
      }
    } catch (error) {
      console.error("Error in chat service:", error);

      // Send error event
      this.sendSSEEvent(res, "error", {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      });

      res.end();
    }
  }

  private async getFormWithCache(formId: string) {
    // Check cache first
    // const cachedForm = await this.redisService.getCachedForm(formId);

    // if (cachedForm) {
    //   return JSON.parse(cachedForm);
    // }

    // Fetch form with questions in one query
    const form = await this.formRepository.findById(formId);

    if (!form) {
      throw new Error("Form not found");
    }

    // Cache the form
    // await this.redisService.cacheForm(formId, form);

    return form;
  }

  private setupSSEHeaders(res: Response): void {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
  }

  private sendSSEEvent(res: Response, event: string, data: any): void {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }
  private createConversationTools() {
    // Tool 2: Save Question Response Tool
    const saveQuestionResponseTool = tool({
      description:
        "Save the user's validated response to a specific question if you are retrying do not save",
      parameters: z.object({
        formResponseId: z.string().describe("ID of the form response"),
        questionId: z.string().describe("ID of the question being answered"),
        response: z.string().describe("The user's response text"),
        isValid: z
          .boolean()
          .describe("Whether the response meets validation requirements"),
        validationMessage: z
          .string()
          .optional()
          .describe("Message explaining why validation failed"),
      }),
      execute: async ({
        formResponseId,
        questionId,
        response,
        isValid,
        validationMessage,
      }) => {
        try {
          if (!isValid) {
            return {
              success: true,
              validated: false,
              message: "Response not saved as it did not pass validation",
              validationMessage,
            };
          }

          // Create new response
          const questionResponse = await this.questionResponseRepository.create(
            {
              questionId,
              formResponseId,
              response,
            }
          );

          return {
            success: true,
            validated: true,
            message: "Question response saved successfully",
            responseId: questionResponse.id,
          };
        } catch (error) {
          console.error("Error saving question response:", error);
          return {
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to save question response",
          };
        }
      },
    });

    const formCompletionTool = tool({
      description:
        "Mark a form as completed when the user has answered the last questions satisfactorily",
      parameters: z.object({
        conversationId: z
          .string()
          .describe("ID of the conversation to mark as completed"),
        isValid: z.boolean().describe("Whether the final answer was valid"),
      }),
      execute: async ({ conversationId, isValid }) => {
        if (!isValid) {
          return {
            success: false,
            message: "Cannot complete form with invalid answer",
          };
        }

        try {
          // Use a transaction to ensure both updates succeed or fail together
          return await AppDataSource.transaction(
            async (transactionalEntityManager) => {
              // Get the conversation with its associated form response
              const conversation = await this.conversationRepository.findById(
                conversationId
              );

              if (!conversation) {
                return {
                  success: false,
                  message: "Conversation not found",
                };
              }

              if (conversation.status === "completed") {
                return {
                  success: true,
                  message: "Form was already marked as completed",
                };
              }

              // Update conversation status
              conversation.status = "completed";
              conversation.endedAt = new Date();

              // Update form response completedAt
              if (conversation.formResponse) {
                conversation.formResponse.completedAt = new Date();

                // Save the form response first
                await transactionalEntityManager.save(
                  conversation.formResponse
                );
              } else {
                return {
                  success: false,
                  message: "Form response not found for this conversation",
                };
              }

              // Save the conversation
              await transactionalEntityManager.save(conversation);

              return {
                success: true,
                message: "Form completed successfully",
                completedAt: conversation.formResponse.completedAt,
              };
            }
          );
        } catch (error) {
          console.error("Error completing form:", error);
          return {
            success: false,
            message:
              error instanceof Error
                ? error.message
                : "Failed to complete form",
          };
        }
      },
    });
    return { saveQuestionResponseTool, formCompletionTool };
  }

  async getConversationByFormResponse(
    formResponseId: string
  ): Promise<Conversation | null> {
    return this.conversationRepository.findByFormResponse(formResponseId);
  }

  async getConversationById(
    conversationId: string
  ): Promise<Conversation | null> {
    return this.conversationRepository.findById(conversationId);
  }

  async getConversationMessages(
    conversationId: string
  ): Promise<ConversationMessage[] | null> {
    return this.conversationMessageRepository.findByConversation(
      conversationId
    );
  }
}
