import { ConversationMessage } from "@/entities/conversationMessageEntity.js";
import { Form } from "@/entities/formEntity.js";
import { Question } from "@/entities/questionEntity.js";

export const CREATE_FORM_PROMPT = `
        You are an AI assistant specialized in creating conversational forms.
        Based on the user's prompt, generate a form with the following JSON structure:
        {
          "title": "Form title",
          "description": "Detailed description of the form's purpose",
          "tone": "friendly | formal | casual | neutral",
          "settings": {
            "welcomeMessage": "Message to display when starting the form",
            "completionMessage": "Message to display when the form is completed",
            "retryMessage": "Message to display when a question needs to be retried"
          },
          "questions": [
            {
              "text": "Question text",
              "type": "text | multiplechoice | number | email",
              "validationRules": {
                "required": true,
                "maxRetries": 0,
                "options": ["Option 1", "Option 2"] // For multiple-choice questions
              },
              "metadata": {
                "description": "Additional context for the question",
                "helpText": "Help text displayed to the user",
                "placeholderText": "Placeholder text for input fields"
              }
            }
            // More questions as needed
          ]
        }

        Design the form to be conversational and engaging. Create 4 questions that will help achieve the form's purpose.
        Make sure the questions flow naturally and logically from one to the next.
        RESPOND ONLY WITH THE JSON OBJECT, no additional explanations or markdown. 
        VERY IMPORTANT: Return ONLY the raw JSON object itself. Do not include any markdown formatting like backticks  or "json" annotations. The response must be valid JSON that can be directly parsed.

      `;

export const SUGGEST_QUESTION_PROMPT = `
You are an AI assistant specializing in creating effective form questions.
Based on the existing questions in the form and the form's purpose, suggest a relevant new question.

The new question should:
1. Be logically connected to the form's purpose and existing questions
2. Not duplicate information already covered by existing questions
3. Help gather additional useful information
4. Be conversational and engaging
5. Follow a similar tone as the existing questions

Generate ONLY a single text-based question with appropriate validation rules and metadata.
Your response should be in this JSON format:
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

Make sure the question feels like a natural addition to the form and maintains consistency with existing questions.
 RESPOND ONLY WITH THE JSON OBJECT, no additional explanations or markdown. 
        VERY IMPORTANT: Return ONLY the raw JSON object itself. Do not include any markdown formatting like backticks  or "json" annotations. The response must be valid JSON that can be directly parsed.
`;

export const generateSuggestQuestionPrompt = (
  form: Form,
  existingQuestions: Question[]
) => {
  return `
          Form Title: ${form.title}
          Form Description: ${form.description}
          Form Tone: ${form.tone || "neutral"}

          Existing Questions:
          ${existingQuestions
            .map((q, index) => {
              return `${index + 1}. "${q.text}" (Type: ${q.type})`;
            })
            .join("\n")}

          Based on this form, suggest a new question that would complement the existing ones and help gather additional useful information.
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
  userResponse?: string
) {
  // Determine if this is the first question

  console.log(
    "Message history",
    conversationMessages,
    "userResponse --",
    userResponse,
    "cenet question asked --",
    recentQuestion
  );
  const isFirstQuestion =
    !conversationMessages || conversationMessages.length === 0;

  return `
    You are a helpful, conversational assistant guiding users through the "${
      form.title
    }" form.
    
    ## FORM DETAILS
    ${JSON.stringify(form, null, 2)}


    ## CONVERSATION STATE
    ${
      isFirstQuestion
        ? "This is the START of a new conversation. Introduce yourself briefly and ask the first question (based on 'question's order')."
        : "This is a CONTINUING conversation. Review the conversation history , recent assistant question , user latest response to determine the current question from the from , evaluate the user's response, and proceed accordingly."
    }

    ${
      recentQuestion
        ? ` "User has responded to this recent question by the assistant : ${recentQuestion}"`
        : ""
    }

    ${userResponse ? `User's latest response: "${userResponse}"` : ""}
    
    
    ${
      conversationMessages?.length
        ? `
        ## CONVERSATION HISTORY

        ${JSON.stringify(conversationMessages, null, 2)}`
        : "No previous messages."
    }

    ## CONVERSATION METADATA

    ${conversationId}
    
    ## INSTRUCTIONS
    1. Respond in a ${form.tone || "neutral"}, conversational manner.
    
    2. Based on the conversation context:
       - Determine which question the user is currently answering
       - Validate their answer against that question's requirements
       - If valid, move to the next question automatically
       - If invalid, explain why and ask them to try again
       - If all questions are answered, thank the user for completing the form
    
 
    
    4. Keep your responses short concise and focused on guiding the user through the form .

    5. IMPORTANT: If recent question was the last QUESTION in the form and the user's answer is VALID:
       a. Call the formCompletionTool tool with these parameters:
          - conversationId: "${conversationId}"
          - isValid: true

  `;
}

//  3. You MUST execute the saveMessageTool after every response with parameters:
//      - conversationId: The conversation ID provided above
//      - content: Your response message
//      - role: "assistant"
