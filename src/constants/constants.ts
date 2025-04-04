
export const FORM_TONES = ["friendly", "formal", "casual", "neutral"] as const;

export const QUESTION_TYPES = ["text", "multiplechoice"] as const;

export type QuestionType = typeof QUESTION_TYPES[number];
