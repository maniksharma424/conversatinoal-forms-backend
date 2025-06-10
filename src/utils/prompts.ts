import { ConversationMessage } from "@/entities/conversationMessageEntity.js";
import { Form } from "@/entities/formEntity.js";
import { Question } from "@/entities/questionEntity.js";

export const CREATE_FORM_PROMPT = `
You are an expert form designer. Create a conversational form using only the user's prompt.

Follow these rules:

1. Generate only **text-based** questions for now (no multiple choice, number, or boolean types).
2. Treat each question as a **topic** or **theme**, not a full question. Keep it short (3–6 words max).
3. Focus entirely on the user's goal or intent.
4. Cover different aspects of the topic without overlap.
5. Avoid asking for info the business already knows (e.g., their name or industry).
6. Use a natural, friendly tone in metadata/helpText, but keep titles short.
7. Output **valid raw JSON only** — no markdown, no extra text.

Format:
{
  "title": "Form title",
  "description": "Purpose of the form",
  "tone": "friendly | formal | casual | neutral",
  "settings": {
    "welcomeMessage": "Shown when form starts",
    "completionMessage": "Shown when form ends",
    "retryMessage": "Shown when user input is invalid"
  },
  "questions": [
    {
      "text": "Topic title (e.g. 'Favourite sport')",
      "type": "text",
      "validationRules": {
        "required": true,
        "maxRetries": 2
      },
      "metadata": {
        "helpText": "Refer to the text of the question",
      }
    }
  ]
}
`;

export const SUGGEST_QUESTION_PROMPT = `
      You are an AI assistant that writes smart, relevant form questions.
      
      Given a form's purpose and existing questions, suggest ONE new text-based question that:
      1. Adds new value (no duplicates)
      2. Treat  question as a **topic** or **theme**, not a full question. Keep it short (3–6 words max).
      3. Gathers meaningful information aligned with the form
      
      Respond ONLY with a valid JSON object like this:
      {
        "text": "The question text",
        "type": "text",
        "validationRules": {
          "required": true,
          "maxRetries": 2
        },
        "metadata": {
          "description": "Purpose of the question",
          "helpText": "Helpful hint for the user",
          "placeholderText": "Example answer or placeholder"
        }
      }
      
      IMPORTANT: Return ONLY the raw JSON object. No markdown, no explanations. The output must be parsable JSON.
      `;

export const generateSuggestQuestionPrompt = (
  form: Form,
  existingQuestions: Question[]
) => {
  return `
Suggest a new, thoughtful, **text-based** question for the form titled "${
    form.title
  }".

---

## FORM DETAILS
- Title: ${form.title}
- Description: ${form.description}
- Tone: ${form.tone || "neutral"}

This form aims to collect meaningful, open-ended insights.

---

## EXISTING QUESTIONS
${existingQuestions
  .map(
    (q, i) =>
      `${i + 1}. "${q.text}" (Type: ${q.type || "text"})${
        q.validationRules?.required ? " [Required]" : ""
      }${q.metadata?.description ? ` — ${q.metadata.description}` : ""}`
  )
  .join("\n")}

---

## INSTRUCTIONS
- Must be a new text-based question (no multiple choice)
- Avoid repetition — it must add new value
- Keep tone aligned with the form: "${form.tone || "neutral"}"
- Encourage personal or detailed answers
- Respond with ONLY the question text
`;
};

/**
 * Generates a comprehensive system prompt for the conversation assistant
 * Handles both new conversations and continuing conversations
 */
export function generateChatPrompt(
  conversationId: string,
  form: Form,
  recentQuestion: string,
  conversationMessages?: ConversationMessage[],
  userResponse?: string,
  formResponseId?: string
) {
  console.log(conversationId, formResponseId); // both are not req here as they are only helpful while making tool calls

  const isFirstQuestion =
    !conversationMessages || conversationMessages.length === 0;
  const tone = form.tone || "neutral";
  const questions = (form.questions || []).map((q) => ({
    id: q.id,
    text: q.text,
    type: q.type,
    // validationRules: q.validationRules,
    // metadata: q.metadata,
    order: q.order,
  }));
  const messages = conversationMessages?.map((msg) => ({
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp,
    questionId: msg.questionId,
  }));

  return `
You are a ${tone}, friendly assistant guiding users through the "${
    form.title
  }" form.

---

##  FORM INFO
- **Title**: ${form.title}
- **Description**: ${form.description}
- **Tone**: ${tone}
- **Max Retries**: ${form.maxRetries || 3}
- **Settings**: ${JSON.stringify(form.settings || {}, null, 2)}
- **Questions**: ${JSON.stringify(questions, null, 2)}
- **conversationId**: ${conversationId || ""}
- **formResponseId**: ${formResponseId || ""}


---

##  CONVERSATION STATE
${isFirstQuestion ? `New conversation.` : `Continuing conversation.`}

${recentQuestion ? `Last Question: "${recentQuestion}"` : ""}
${userResponse ? `User Response: "${userResponse}"` : ""}
${
  messages?.length
    ? `Full Message History:\n${JSON.stringify(messages, null, 2)}`
    : ""
}

---

##  INSTRUCTIONS

1. Use a (${tone})  tone .
2. Ask one question at a time.
   - Use the text field from each question as the **topic**, and craft a **brief, direct** question from it.
   - Begin with a **fun intro** or **compliment**, especially after each user response.
     - Example: "Awesome!", "You're on fire!", "Soccer, a classic!"
3. Do **not** ask follow-ups or dig deeper.
   - Accept any valid response and move on.
   - Avoid asking for stories, examples, or deeper insights unless prompted by metadata.
4. Validate the user's response using validationRules.
   - If invalid, retry using metadata.helpText or say "Let's skip this one" after max retries.
5. Start every conversation by asking for the user's **name** first.
6. Conclude with a fun, positive thank-you once all questions are answered , say Feel free to continue in order to get more details .



Proceed with the next appropriate step.
`;
}

export function generateToolCallingPromptForChat(
  conversationId: string,
  form: Form,
  recentQuestion: string,
  conversationMessages?: ConversationMessage[],
  userResponse?: string,
  formResponseId?: string
) {
  const isFirstQuestion =
    !conversationMessages || conversationMessages.length === 0;

  return `
You are an assistant evaluating a user's responses for the "${
    form.title
  }" form. Your task is to decide whether to call any tools (e.g., to save responses, update identity, or mark the form as complete).

Your response MUST be a valid JSON object representing the tool call (e.g., { "tool": "toolName", "parameters": { ... } }), or an empty JSON object {} if no tool call is required.

---

## FORM DETAILS
${JSON.stringify(form, null, 2)}

---

## CONVERSATION STATE

${
  isFirstQuestion
    ? "This is the START of a new conversation. No tool calls are expected at this stage."
    : "This is a CONTINUING conversation. Use the recent question and the user's latest response to determine the context and decide if a tool call is needed. If recentQuestion or userResponse is missing, use the conversation history to infer the current state."
}

${
  recentQuestion
    ? `## Recent Question
"${recentQuestion}"`
    : ""
}

${
  userResponse
    ? `## User's Latest Response
"${userResponse}"`
    : ""
}

${
  formResponseId
    ? `## Form Response ID
${formResponseId}`
    : ""
}

${
  conversationMessages?.length
    ? `## CONVERSATION HISTORY
${JSON.stringify(conversationMessages, null, 2)}`
    : "No previous messages."
}

---

## INSTRUCTIONS

1. **Determine the Current Question**  
   Match the recent question with the form's questions using their text field. Extract its validationRules and metadata for use in evaluation.

2. **Validate the User's Response**
   - Use validation rules (e.g., required, options, maxRetries) to decide if the user's input is valid.
   - If invalid, do **not** call any tool.

3. **Save Valid Responses**
   - If formResponseId is present **and** the response is valid:
     Call the saveQuestionResponse tool:

     {
       "tool": "saveQuestionResponse",
       "parameters": {
         "formResponseId": "${formResponseId}",
         "questionId": "<match using recentQuestion text>",
         "response": "${userResponse}",
         "isValid": true
       }
     }


4. **Update Identity Info**
   - If the user has shared a name or email (based on question intent or keywords in their answer):
     Call the updateFormResponse tool:

     {
       "tool": "updateFormResponse",
       "parameters": {
         "conversationId": "${conversationId}",
         "name": "<extracted name if present>",
         "email": "<extracted email if present>"
       }
     }


5. **Detect Completion**
   - If after determining the current question it came to be the last topic   the last question in the form  **and** the user response is valid:
     Call the formCompletionTool:
     {
       "tool": "formCompletionTool",
       "parameters": {
         "conversationId": "${conversationId}",
         "userId": "${form.userId}",
         "isValid": true
       }
     }

`;
}

export function generateConversationSummaryPrompt(
  conversationId: string,
  conversationMessages: ConversationMessage[] | null
): string {
  // Validate input
  const hasMessages =
    Array.isArray(conversationMessages) && conversationMessages.length > 0;

  return `
    You are an AI analytics assistant tasked with generating a concise, insightful summary of a conversation from a Conversational Form, designed to provide actionable insights for a business dashboard.

    ## CONVERSATION METADATA
    Conversation ID: ${conversationId}

    ## CONVERSATION HISTORY
    ${
      hasMessages
        ? conversationMessages
            .map(
              (msg, index) => `
              Message ${index + 1}:
              - Role: ${msg.role}
              - Content: ${msg.content}
              - Timestamp: ${msg.timestamp}
              - Question ID: ${msg.questionId ?? "N/A"}
            `
            )
            .join("\n")
        : "No messages available for this conversation."
    }

    ## INSTRUCTIONS
    1. Analyze the conversation to understand user behavior, engagement, and intent, going beyond merely summarizing questions and answers.
    2. Produce a concise summary (2-4 sentences) that captures:
       - The primary purpose or goal of the conversation within the context of the Conversational Form (e.g., lead generation, feedback collection, customer support).
       - Key user behaviors or patterns (e.g., response speed, hesitation, question skipping, tone shifts, or completion rates).
       - Inferred user intent or sentiment (e.g., curiosity, frustration, satisfaction) based on response style, word choice, or interaction flow.
       - Actionable insights for businesses (e.g., areas of user confusion, drop-off points, or opportunities to improve the form).
    3. If no messages are provided, state: "No conversation has occurred for this ID."
    4. Avoid directly quoting or pasting questions and answers; instead, synthesize insights that reflect user behavior and interaction dynamics.
    5. Ensure the summary is clear, professional, and tailored for a business dashboard, using neutral language focused on analytics.
    6. Do not include assumptions or information not derived from the conversation messages.
  `;
}

// Helper function to generate the form summary prompt
export function generateFormSummaryPrompt(
  formId: string,
  formTitle: string,
  conversationSummaries: { conversationId: string; summary: string }[] | null
): string {
  // Validate input
  const hasSummaries =
    Array.isArray(conversationSummaries) && conversationSummaries.length > 0;

  return `
    You are an AI analytics assistant tasked with generating a concise, insightful summary of a Conversational Form based on conversation summaries, designed to provide actionable analytics for a business dashboard.

    ## FORM METADATA
    Form ID: ${formId}
    Form Title: ${formTitle}

    ## CONVERSATION SUMMARIES
    ${
      hasSummaries
        ? conversationSummaries
            .map(
              (cs, index) => `
              Conversation ${index + 1}:
              - Conversation ID: ${cs.conversationId}
              - Summary: ${cs.summary}
            `
            )
            .join("\n")
        : "No conversation summaries available for this form."
    }

    ## INSTRUCTIONS
    1. Analyze the conversation summaries to identify trends, user behaviors, and insights across responses to the Conversational Form.
    2. Produce a concise summary (3-5 sentences) that captures:
       - The primary objective of the form (e.g., lead qualification, customer feedback, support ticket creation).
       - Common user behaviors or engagement patterns (e.g., frequent drop-offs, high engagement with specific questions, response consistency).
       - Aggregated user sentiment or intent (e.g., positive feedback, recurring frustrations, or confusion) inferred from response trends.
       - Actionable insights for businesses (e.g., high completion rates, common pain points, opportunities to optimize form flow or question clarity).
       - Notable variations or outliers in user interactions (e.g., specific demographics showing different behaviors, if inferable).
    3. If no conversation summaries are provided, state: "No responses have been recorded for this form."
    4. Avoid directly quoting or repeating individual conversation summaries; instead, synthesize trends and insights across all responses.
    5. Ensure the summary is clear, professional, and tailored for a business dashboard, using neutral language focused on analytics.
    6. Do not include assumptions or information not derived from the conversation summaries.
    7. Highlight any trends or insights that could inform business decisions, such as improving form design or targeting specific user segments.
  `;
}
