// src/services/questionService.ts
import { Question } from "../entities/questionEntity.js";
import { Form } from "../entities/formEntity.js";
import { QuestionRepository } from "@/repository/questionRepository.js";

export interface QuestionCreateDTO {
  text: string;
  type: string;
  order?: number;
  validationRules?: {
    required?: boolean;
    maxRetries?: number;
    options?: string[];
  };
  metadata?: {
    description?: string;
    helpText?: string;
    placeholderText?: string;
  };
}

export interface QuestionUpdateDTO {
  text?: string;
  type?: string;
  order?: number;
  validationRules?: {
    required?: boolean;
    maxRetries?: number;
    options?: string[];
  };
  metadata?: {
    description?: string;
    helpText?: string;
    placeholderText?: string;
  };
}

export class QuestionService {
  private questionRepository: QuestionRepository;

  constructor() {
    this.questionRepository = new QuestionRepository();
  }

  async getQuestionById(id: string): Promise<Question | null> {
    try {
      const question = await this.questionRepository.findById(id);

      return question;
    } catch (error) {
      console.error("Error retrieving question by ID:", error);
      throw new Error(
        `Failed to retrieve question: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async getQuestionsByForm(formId: string): Promise<Question[]> {
    try {
      if (!formId) {
        throw new Error("Form ID is required");
      }

      return await this.questionRepository.findByForm(formId);
    } catch (error) {
      console.error("Error retrieving questions for form:", error);
      throw new Error(
        `Failed to retrieve questions for form: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async createQuestion(
    questionData: QuestionCreateDTO,
    form: Form
  ): Promise<Question> {
    try {
      if (!questionData.text) {
        throw new Error("Question text is required");
      }

      if (!questionData.type) {
        throw new Error("Question type is required");
      }

      if (!form || !form.id) {
        throw new Error("Valid form is required");
      }

      // Validate options for multiple choice questions
      if (
        questionData.type === "multiplechoice" &&
        (!questionData.validationRules?.options ||
          questionData.validationRules.options.length === 0)
      ) {
        throw new Error("Multiple choice questions require options");
      }

      const newQuestion = {
        ...questionData,
        form,
      };

      return await this.questionRepository.create(newQuestion);
    } catch (error) {
      console.error("Error creating question:", error);
      throw new Error(
        `Failed to create question: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async createManyQuestions(
    questionsData: QuestionCreateDTO[],
    form: Form
  ): Promise<Question[]> {
    try {
      if (!Array.isArray(questionsData)) {
        throw new Error("Questions data must be an array");
      }

      if (questionsData.length === 0) {
        return [];
      }

      if (!form || !form.id) {
        throw new Error("Valid form is required");
      }

      const questions: Question[] = [];

      // Create questions one by one to maintain order
      for (let i = 0; i < questionsData.length; i++) {
        try {
          const questionData = {
            ...questionsData[i],
            // Assign order based on array index if not provided
            order:
              questionsData[i].order !== undefined ? questionsData[i].order : i,
          };

          const question = await this.createQuestion(questionData, form);
          questions.push(question);
        } catch (questionError) {
          console.error(
            `Error creating question at index ${i}:`,
            questionError
          );
        }
      }

      if (questions.length === 0 && questionsData.length > 0) {
        throw new Error("Failed to create any questions");
      }

      return questions;
    } catch (error) {
      console.error("Error creating multiple questions:", error);
      throw new Error(
        `Failed to create questions: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async updateQuestion(
    id: string,
    questionData: QuestionUpdateDTO
  ): Promise<Question | null> {
    try {
      if (!id) {
        throw new Error("Question ID is required");
      }

      // Verify the question exists before updating
      const existingQuestion = await this.questionRepository.findById(id);
      if (!existingQuestion) {
        return null;
      }

      // Validate options for multiple choice questions if type is being updated
      if (
        questionData.type === "multiplechoice" &&
        questionData.validationRules &&
        (!questionData.validationRules.options ||
          questionData.validationRules.options.length === 0)
      ) {
        throw new Error("Multiple choice questions require options");
      }

      return await this.questionRepository.update(id, questionData);
    } catch (error) {
      console.error("Error updating question:", error);
      throw new Error(
        `Failed to update question: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async deleteQuestion(id: string): Promise<boolean> {
    try {
      if (!id) {
        throw new Error("Question ID is required");
      }

      // Verify the question exists before deleting
      const existingQuestion = await this.questionRepository.findById(id);
      if (!existingQuestion) {
        return false;
      }

      return await this.questionRepository.delete(id);
    } catch (error) {
      console.error("Error deleting question:", error);
      throw new Error(
        `Failed to delete question: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async reorderQuestions(
    formId: string,
    questionIds: string[]
  ): Promise<boolean> {
    try {
      if (!formId) {
        throw new Error("Form ID is required");
      }

      if (!Array.isArray(questionIds) || questionIds.length === 0) {
        throw new Error("Question IDs array is required and cannot be empty");
      }

      // Verify all questions exist and belong to the form
      const formQuestions = await this.questionRepository.findByForm(formId);
      const formQuestionIds = formQuestions.map((q) => q.id);

      // Check if all provided IDs belong to the form
      const invalidIds = questionIds.filter(
        (id) => !formQuestionIds.includes(id)
      );
      if (invalidIds.length > 0) {
        throw new Error(
          `Some question IDs do not belong to the form: ${invalidIds.join(
            ", "
          )}`
        );
      }

      // Check if all form questions are included in the reordering
      if (questionIds.length !== formQuestions.length) {
        throw new Error(
          `Reordering must include all ${formQuestions.length} questions from the form`
        );
      }

      return await this.questionRepository.reorder(formId, questionIds);
    } catch (error) {
      console.error("Error reordering questions:", error);
      throw new Error(
        `Failed to reorder questions: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
