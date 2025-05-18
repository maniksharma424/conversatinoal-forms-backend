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
  userResponse?: string,
  formResponseId?: string
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
        : "This is a CONTINUING conversation. From ## RecentQuestion , and ## USER's Latest Response  determine the current question from the from , evaluate the user's response, and proceed accordingly Review the last message in MESSAGES and it's role to determine the conversation state.If ## RecentQuestion and ## RecentQuestion  are not present Review the conversation history , Review the last message in MESSAGES and it's role to determine the conversation state recent assistant question , user latest response to determine the current question from the from , evaluate the user's response, and proceed accordingly."
    }

    ${
      recentQuestion
        ? ` " ## RecentQuestion 
        User has responded to this recent question by the assistant : ${recentQuestion}"`
        : ""
    }
    ${
      formResponseId
        ? ` " ## formResponseId 
        User is currently responsing to form with formResponseId as : ${formResponseId}"`
        : ""
    }

    ${
      userResponse
        ? `
    ## User's Latest Response
    User's latest response: "${userResponse}"`
        : ""
    }
    
    
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
       - If last message was from the assistant, ask the same question again they might have missed it
       - If all questions are answered, thank the user for completing the form
    
 
    
    4. Keep your responses short concise and focused on guiding the user through the form .

    5. IMPORTANT: If recent question was the last QUESTION in the form and the user's answer is VALID:
       a. Call the formCompletionTool tool with these parameters:
          - conversationId: "${conversationId}"
          - isValid: true
          - userId: ${form.userId}
    
    6. IMPORTANT: If user has given his Name or Email in any of the answer for the question:
       a. Call the updateFormResponse tool with these parameters:
          - conversationId: "${conversationId}"
          - name: name provided by user in the answer
          - email: email provided by user in the answer
      

    7. IMPORTANT: If formResponseId is present (FormResponseId - ${formResponseId}) and only if user's answer is VALID for the question execute the saveQuestionResponse tool with these parameters:
         - formResponseId = ${formResponseId},
         - questionId = Determine Question ID  from the questions present in the form ${
           form.questions
         } and the recent question asked,
         - response = ${userResponse},
         - isValid - True,
  `;
}

export function generateConversationSummaryPrompt(
  conversationId: string,
  conversationMessages: ConversationMessage[]
): string {
  // Determine if there are any messages
  const hasMessages = conversationMessages && conversationMessages.length > 0;

  return `
    You are a helpful assistant tasked with generating a concise summary of a conversation based on the provided conversation messages.

    ## CONVERSATION METADATA
    Conversation ID: ${conversationId}

    ## CONVERSATION HISTORY
    ${
      hasMessages
        ? `
        ${JSON.stringify(
          conversationMessages.map((msg) => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
            questionId: msg.questionId,
          })),
          null,
          2
        )}`
        : "No messages in the conversation."
    }

    ## INSTRUCTIONS
    1. Analyze the conversation messages to identify key points, topics, and outcomes.
    2. Generate a concise summary (2-4 sentences) that captures:
       - The main purpose or topic of the conversation.
       - Key questions asked and their responses (if applicable).
       - Any significant outcomes or conclusions (e.g., form completion, user intent).
       - The overall tone and flow of the conversation.
    3. If the conversation is empty, state that no conversation has occurred.
    4. Ensure the summary is clear, neutral, and focused on the conversation's content.
    5. Do not include any external assumptions or information not present in the messages.
  `;
}

// Helper function to generate the form summary prompt
export function generateFormSummaryPrompt(
  formId: string,
  formTitle: string,
  conversationSummaries: { conversationId: string; summary: string }[]
): string {
  // Determine if there are any conversation summaries
  const hasSummaries = conversationSummaries && conversationSummaries.length > 0;

  return `
    You are a helpful assistant tasked with generating a concise summary of a form based on the summaries of conversations related to its responses.

    ## FORM METADATA
    Form ID: ${formId}
    Form Title: ${formTitle}

    ## CONVERSATION SUMMARIES
    ${
      hasSummaries
        ? `
        ${JSON.stringify(
          conversationSummaries.map((cs) => ({
            conversationId: cs.conversationId,
            summary: cs.summary,
          })),
          null,
          2
        )}`
        : "No conversation summaries available for this form."
    }

    ## INSTRUCTIONS
    1. Analyze the conversation summaries to identify common themes, key insights, and overall trends in the form responses.
    2. Generate a concise summary (3-5 sentences) that captures:
       - The main purpose or objective of the form.
       - Common topics or patterns in user responses (e.g., frequent answers, concerns, or feedback).
       - Any significant outcomes or insights derived from the conversations (e.g., user satisfaction, completion rates).
       - The overall tone and context of the responses.
    3. If no conversation summaries are available, state that no responses have been recorded for the form.
    4. Ensure the summary is clear, neutral, and focused on the form's purpose and response trends.
    5. Do not include any external assumptions or information not present in the conversation summaries.
  `;
}
