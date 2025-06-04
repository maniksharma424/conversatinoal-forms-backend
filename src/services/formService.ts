// src/services/formService.ts
import { FormRepository } from "@/repository/formRepository.js";
import { Form } from "../entities/formEntity.js";

import { AIService } from "./aiService.js";
import {
  CREATE_FORM_PROMPT,
  generateFormSummaryPrompt,
} from "@/utils/prompts.js";
import { QuestionService } from "./questionService.js";

import { FormResponseService } from "./formResponseService.js";
import { ConversationService } from "./conversationService.js";
import { GrokService } from "./grokChatService.js";

export interface FormCreate {
  userPrompt: string;
  tone?: string;
  settings?: {
    welcomeMessage?: string;
    completionMessage?: string;
    retryMessage?: string;
    theme?: string;
  };
}

export interface FormUpdate {
  description?: string;
  tone?: string;
  settings?: {
    welcomeMessage?: string;
    completionMessage?: string;
    retryMessage?: string;
    theme?: string;
  };
}

export class FormService {
  private formRepository: FormRepository;
  private aiService: AIService;
  private questionService: QuestionService;
  private formResponseService: FormResponseService;
  private conversationService: ConversationService;
  private grokChatService: GrokService;

  constructor() {
    this.formRepository = new FormRepository();
    this.aiService = new AIService();
    this.questionService = new QuestionService();
    this.conversationService = new ConversationService();
    this.formResponseService = new FormResponseService();
    this.grokChatService = new GrokService();
  }

  async getAllForms(userId: string): Promise<Form[]> {
    return this.formRepository.findByUser(userId);
  }

  async getFormById(formId: string, isPublic = false): Promise<Form | null> {
    return this.formRepository.findById(formId, isPublic);
  }

  async createFormFromPrompt(
    promptData: FormCreate,
    userId: string
  ): Promise<Form> {
    try {
      // Generate the form content using the AI service
      // const { response } = await this.aiService.generateText({
      //   prompt: promptData.userPrompt,
      //   systemPrompt: CREATE_FORM_PROMPT,
      //   temperature: 0.7,
      //   maxTokens: 4000,
      //   format: "json",
      // });
      // using grok service to generate for as it is  faster
      const response = await this.grokChatService.generateText({
        messages: [
          {
            role: "system",
            content: CREATE_FORM_PROMPT,
          },
          { role: "user", content: promptData.userPrompt },
        ],
      });
      console.log(response, "geenrated");
      // Parse the AI-generated form
      let formData;
      try {
        formData = JSON.parse(response.trim());
      } catch (parseError) {
        console.error("Error parsing AI response as JSON:", parseError);
        console.log("Raw AI response:", response);
        throw new Error("Generated form data is not valid JSON");
      }

      // Extract questions for later creation
      const questions = formData.questions || [];
      delete formData.questions;

      // Create the form
      const form = await this.formRepository.create({
        ...formData,
        userId,
      });

      // Create questions for the form
      if (questions?.length > 0) {
        await this.questionService.createManyQuestions(questions, form);
      }

      // Return the form with questions loaded
      const createdForm = await this.formRepository.findById(form.id);
      if (createdForm) {
        return createdForm;
      } else {
        throw new Error(
          "Created new form but unable to retrive it. Try again "
        );
      }
    } catch (error) {
      console.error("Error creating form from prompt:", error);
      throw new Error(
        `${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  async updateForm(formId: string, formData: FormUpdate): Promise<Form | null> {
    return this.formRepository.update(formId, formData);
  }

  async deleteForm(formId: string): Promise<boolean> {
    return this.formRepository.delete(formId);
  }

  async publishForm(formId: string): Promise<Form | null> {
    try {
      return await this.formRepository.publish(formId);
    } catch (error) {
      console.error("Error publishing form:", error);
      throw error;
    }
  }

  async unpublishForm(formId: string): Promise<Form | null> {
    return this.formRepository.unpublish(formId);
  }

  async generateFormSummary(formId: string): Promise<Form | null> {
    console.log(formId, "formId-summary");
    try {
      // Fetch all form responses for the form
      const form = await this.formRepository.findById(formId);
      const isDraftForm = form?.isPublished === false;
      if (isDraftForm) {
        return null; // Skip summary generation for draft forms
      }
      const formResponses = await this.formResponseService.getResponsesByForm(
        formId
      );
      console.log(formResponses, "formResponses-summary");
      // Fetch conversations for each form response and extract summaries
      const conversationSummaries = [];
      for (const response of formResponses) {
        const conversation = await this.conversationService.getConversationById(
          response.conversation.id
        );
        if (conversation?.summary) {
          conversationSummaries.push({
            conversationId: conversation.id,
            summary: conversation.summary,
          });
        }
      }

      // Generate the prompt for summarizing the form
      const summaryPrompt = generateFormSummaryPrompt(
        formId,
        form?.title || "Untitled Form",
        conversationSummaries
      );

      // Generate the summary using the AI service
      const text = await this.aiService.generateText({
        prompt: summaryPrompt,
        systemPrompt:
          "You are a helpful assistant analyzing conversation summaries to generate a summary of a form's responses",
        temperature: 0.7,
      });

      const summary = text.response;

      // Update the form with the generated summary
      return this.formRepository.update(formId, { summary });
    } catch (error) {
      console.error("Error generating form summary:", error);
      return null;
    }
  }
}
