// src/controllers/formResponseController.ts
import { NextFunction, Request, Response } from "express";

import { FormService } from "../services/formService.js";
import { ConversationService } from "../services/conversationService.js";
import { FormResponseService } from "@/services/formResponseService.js";

const formResponseService = new FormResponseService();
const formService = new FormService();
const conversationService = new ConversationService();

// Get all responses for a specific form
export const getFormResponsesController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const formId = req.params.formId;
    const userId = req.user?.id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    // Verify the form exists and belongs to the user
    const form = await formService.getFormById(formId);

    if (!form) {
      return res
        .status(404)
        .json({ success: false, message: "Form not found" });
    }

    if (form.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access responses for this form",
      });
    }

    const responses = await formResponseService.getResponsesByForm(formId);
    return res.json({ success: true, data: responses });
  } catch (error) {
    next(error);
  }
};

// Get conversation for a specific form response
export const getFormResponseConversationController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const responseId = req.params.responseId;
    const userId = req.user?.id;


    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    // Fetch the form response
    const response = await formResponseService.getResponseById(responseId);
    console.log(response);
    if (!response) {
      return res
        .status(404)
        .json({ success: false, message: "Form response not found" });
    }

    // Verify the response is for a form that belongs to the user
    const form = await formService.getFormById(response.formId);

    if (!form) {
      return res
        .status(404)
        .json({ success: false, message: "Associated form not found" });
    }

    if (form.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this response conversation",
      });
    }

    // Get the conversation for this response
    const conversation =
      await conversationService.getConversationByFormResponse(responseId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "No conversation found for this response",
      });
    }

    return res.json({ success: true, data: conversation });
  
} catch (error) {
    next(error);
  }
};
