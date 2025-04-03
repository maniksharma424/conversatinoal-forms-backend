// src/validators/formValidator.ts
import { FormCreate, FormUpdate } from "@/services/formService.js";
import { z } from "zod";

// Schema for form settings
const settingsSchema = z
  .object({
    welcomeMessage: z.string().optional(),
    completionMessage: z.string().optional(),
    retryMessage: z.string().optional(),
    theme: z.string().optional(),
  })
  .optional();

// Schema for form creation
const formCreateSchema = z.object({
  userPrompt: z
    .string()
    .min(20, "prompt must be at least  characters")
    .max(400, "prompt cannot exceed 400 characters"),

  tone: z
    .enum(["friendly", "formal", "casual", "neutral"])
    .optional()
    .default("neutral"),
});

// Create a constant for available tones
export const FORM_TONES = ["friendly", "formal", "casual", "neutral"] as const;

// Create a type from the constant
export type FormTone = typeof FORM_TONES[number];

// Update your schema to use the constant and catch these issues
const formUpdateSchema = z
  .object({
    description: z
      .string()
      .min(10, "Description must be at least 10 characters")
      .optional(),
    tone: z
      .enum(FORM_TONES, {
        errorMap: () => ({
          message: `Tone must be one of: ${FORM_TONES.join(", ")}`,
        }),
      })
      .optional(),
    settings: settingsSchema.optional(),
  })
  .strict()
  .refine(
    (data) => {
      // Ensure at least one field is present
      return Object.keys(data).length > 0;
    },
    {
      message:
        "At least one field (description, tone, or settings) must be provided",
    }
  );

// Validation function for form creation
export const validateFormCreate = (
  data: unknown
): {
  success: boolean;
  data?: FormCreate;
  errors?: z.ZodError<FormCreate>;
} => {
  try {
    const validatedData = formCreateSchema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
};

// Validation function for form updates
export const validateFormUpdate = (
  data: unknown
): {
  success: boolean;
  data?: FormUpdate;
  errors?: z.ZodError<FormUpdate>;
} => {
  try {
    const validatedData = formUpdateSchema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
};
