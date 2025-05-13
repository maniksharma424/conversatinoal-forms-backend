// src/controllers/testStreamController.ts
import { Request, Response, NextFunction } from "express";
import { AIService } from "../services/aiService.js";
import { ConversationService } from "@/services/conversationService.js";
import { RedisService } from "@/services/redisService.js";
import { getFormSession } from "@/utils/jwtSession.js";
import { FormResponseService } from "@/services/formResponseService.js";

const conversationService = new ConversationService();
const formResponseService = new FormResponseService();

export const testStreamController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get query parameters
    const prompt =
      (req.query.prompt as string) || "Tell me about conversational AI";

    // Set up headers for SSE (Server-Sent Events)
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Initialize AI service
    const aiService = new AIService();

    // Log the start of streaming
    console.log("Starting stream for prompt:", prompt);

    // Create system prompt similar to what we'd use in conversation
    const systemPrompt = `
      You are a helpful conversational assistant for a form-filling application.
      Keep your responses concise, friendly, and natural-sounding.
      Respond to the user's input as if you were helping them complete a form.
    `;

    // Use the streaming function from our AI service
    const stream = aiService.generateStreamText({
      prompt,
      systemPrompt,
      temperature: 0.7,
      maxTokens: 500,

      // Handle each chunk as it arrives
      onChunk: (chunk) => {
        if (chunk.type === "text-delta") {
          // In a real implementation, you might:
          // 1. Update conversation state in database
          // 2. Process the text in some way
          console.log("Chunk received:", chunk.text);
        }
      },

      // Handle errors
      onError: (error) => {
        console.error("Stream error:", error);
        // In production, you might log this to your monitoring system
      },

      // When the stream completes
      onFinish: (data) => {
        console.log("Stream finished. Total tokens:", data.usage?.totalTokens);

        // In a real implementation, you would:
        // 1. Save the complete response to ConversationMessage
        // 2. Update conversation state to ready for next question
        // 3. Perform any validation on user input based on the AI response

        // Send an event signaling the end of the stream
        res.write('event: end\ndata: {"status":"complete"}\n\n');
        res.end();
      },
    });

    // Stream the text to the client
    for await (const textPart of stream.textStream) {
      // Format as SSE
      res.write(`data: ${JSON.stringify({ text: textPart })}\n\n`);

      // Ensure the data is sent immediately
      //   res.flush?.();
    }
  } catch (error) {
    console.error("Error in test stream:", error);

    // Try to send an error event if possible
    try {
      res.write(
        `event: error\ndata: ${JSON.stringify({
          error: "Stream processing failed",
        })}\n\n`
      );
      res.end();
    } catch (sendError) {
      // If we can't send an error event, just end the response
      res.end();
    }

    // Don't pass to next() as we've already handled the response
  }
};

export const chatController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const formId = req.params.formId;
    const { question, answer, conversationId } = req.body;

    // Validate req params
    if (!formId) {
      return res
        .status(404)
        .json({ success: false, message: "FormId is required" });
    }

    await conversationService.chat({
      formId: formId,
      res: res,
      conversationId: conversationId,
      question: question,
      answer: answer,
    });
  } catch (error) {
    console.error("Error starting conversation:", error);
    next(error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to start conversation",
    });
  }
};

// Controller for restoring conversation session
export const restoreConversationController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { formId } = req.body;

    if (!formId) {
      return res.status(400).json({
        success: false,
        message: "FormId is required",
      });
    }
    // Get session from cookies
    const session = getFormSession(req, formId);

    if (!session || session.formId !== formId) {
      return res.status(403).json({
        success: false,
        message: "Invalid session or session expired",
      });
    }

    // Otherwise, restore the existing session
    const formResponse = await formResponseService.getResponseById(
      session.responseId
    );

    if (!formResponse || formResponse.completedAt) {
      return res.status(404).json({
        success: false,
        message: "Form response not found or already completed",
      });
    }

    const conversation =
      await conversationService.getConversationByFormResponse(
        session.responseId
      );

    if (!conversation || conversation.status !== "in_progress") {
      return res.status(404).json({
        success: false,
        message: "Conversation not found or not in progress",
      });
    }

    // Use the chat service to continue the conversation
    await conversationService.chat({
      formId,
      conversationId: conversation.id,
      question: undefined, // chat service handles the last messages by conversation ID
      answer: undefined,
      res,
    });
  } catch (error) {
    console.error("Error restoring session:", error);
    next(error);
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to restore session",
    });
  }
};
