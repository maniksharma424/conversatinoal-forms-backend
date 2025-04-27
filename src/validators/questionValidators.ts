// src/validators/questionValidator.ts
import { z } from "zod";
import {
  QuestionCreateDTO,
  QuestionUpdateDTO,
} from "../services/questionService.js";
import { QUESTION_TYPES } from "@/constants/constants.js";

// Schema for validation rules
const validationRulesSchema = z
  .object({
    required: z.boolean().optional().default(true),
    maxRetries: z.number().int().min(0).max(10).optional().default(2),
    options: z.array(z.string()).optional().nullable(),
  })
  .refine(
    (data) => {
      // If question type is multiplechoice, options are required
      return true; // This will be checked at the parent level
    },
    {
      message: "Options are required for multiple choice questions",
    }
  );

// Schema for metadata
const metadataSchema = z
  .object({
    description: z.string().optional(),
    helpText: z.string().optional(),
    placeholderText: z.string().optional(),
  })
  .optional()
  .default({
    helpText: " Refer text of the question",
    description: "Refer text of the question ",
    placeholderText: "Enter your answer here",
  });

// Schema for question creation
const questionCreateSchema = z
  .object({
    text: z.string().optional().default(""),
    type: z
      .enum(QUESTION_TYPES, {
        errorMap: () => ({
          message: `Question type must be one of: ${QUESTION_TYPES.join(", ")}`,
        }),
      })
      .default("text"),
    order: z.number().int().min(0).optional(),
    validationRules: validationRulesSchema
      .optional()
      .default({ maxRetries: 2, required: true, options: null }),
    metadata: metadataSchema,
  })
  .refine(
    (data) => {
      // If type is multiplechoice, options must be provided in validationRules
      if (data.type?.toLowerCase() === "multiplechoice") {
        return (
          data.validationRules &&
          Array.isArray(data.validationRules.options) &&
          data.validationRules.options.length > 1
        );
      }
      return true;
    },
    {
      message: "Multiple choice questions require more than 1 options",
      path: ["validationRules.options"],
    }
  )
  .refine(
    (data) => {
      // If type is not multiplechoice, options should not be provided
      if (data.type?.toLowerCase() !== "multiplechoice") {
        return (
          !data.validationRules?.options ||
          !Array.isArray(data.validationRules.options) ||
          data.validationRules.options.length === 0
        );
      }
      return true;
    },
    {
      message: "Options should only be provided for multiple choice questions",
      path: ["validationRules.options"],
    }
  );

// Schema for question update (similar to create but all fields optional)
const questionUpdateSchema = z
  .object({
    text: z
      .string()
      .optional(),
    type: z
      .enum(QUESTION_TYPES, {
        errorMap: () => ({
          message: `Question type must be one of: ${QUESTION_TYPES.join(", ")}`,
        }),
      })
      .optional(),
    order: z.number().int().min(0).optional(),
    validationRules: validationRulesSchema.optional(),
    metadata: metadataSchema,
  })
  .strict()
  .refine(
    (data) => {
      // If type is multiplechoice, options must be provided in validationRules
      if (data.type === "multiplechoice") {
        return (
          data.validationRules &&
          Array.isArray(data.validationRules.options) &&
          data.validationRules.options.length > 1
        );
      }
      return true;
    },
    {
      message: "Multiple choice questions require more than 1 options",
      path: ["validationRules.options"],
    }
  );

// Schema for question reordering
const questionReorderSchema = z
  .object({
    questionIds: z
      .array(z.string().uuid("Each question ID must be a valid UUID"))
      .min(1, "At least one question ID is required"),
  })
  .strict();

// Validation function for question creation
export const validateQuestionCreate = (
  data: unknown
): {
  success: boolean;
  data?: QuestionCreateDTO;
  errors?: z.ZodError<QuestionCreateDTO>;
} => {
  try {
    const validatedData = questionCreateSchema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
};

// Validation function for question updates
export const validateQuestionUpdate = (
  data: unknown
): {
  success: boolean;
  data?: QuestionUpdateDTO;
  errors?: z.ZodError<QuestionUpdateDTO>;
} => {
  try {
    const validatedData = questionUpdateSchema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
};

// Validation function for question reordering
export interface QuestionReorderDTO {
  questionIds: string[];
}

export const validateQuestionReorder = (
  data: unknown
): {
  success: boolean;
  data?: QuestionReorderDTO;
  errors?: z.ZodError<QuestionReorderDTO>;
} => {
  try {
    const validatedData = questionReorderSchema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
};
