// src/controllers/questionController.ts
import { NextFunction, Request, Response } from "express";
import { FormService } from "../services/formService.js";
import { QuestionService } from "../services/questionService.js";
import {
  validateQuestionCreate,
  validateQuestionUpdate,
  validateQuestionReorder,
} from "../validators/questionValidators.js";

const formService = new FormService();
const questionService = new QuestionService();

export const getQuestionsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const formId = req.params.formId;
    const userId = req.user?.id;

    // Verify the form exists and user has access
    const form = await formService.getFormById(formId);
    if (!form) {
      return res
        .status(404)
        .json({ success: false, message: "Form not found" });
    }

    if (form.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access questions for this form",
      });
    }

    const questions = await questionService.getQuestionsByForm(formId);
    return res.json({ success: true, data: questions });
  } catch (error) {
    next(error);
  }
};

export const createQuestionController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const formId = req.params.formId;
    const userId = req.user?.id;

    // Verify the form exists and user has access
    const form = await formService.getFormById(formId);
    if (!form) {
      return res
        .status(404)
        .json({ success: false, message: "Form not found" });
    }

    if (form.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to add questions to this form",
      });
    }

    // Validate the question data
    const validationResult = validateQuestionCreate(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationResult.errors,
      });
    }

    // Create the question
    if (validationResult.data) {
      const question = await questionService.createQuestion(
        validationResult.data,
        form
      );
      return res.status(201).json({ success: true, data: question });
    }
  } catch (error) {
    next(error);
  }
};



export const updateQuestionController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const formId = req.params.formId;
    const questionId = req.params.id;
    const userId = req.user?.id;

    // Verify at least 1 field is provided for update
    const fields = Object.keys(req.body);
    if (fields.length <= 0) {
      return res.status(404).json({
        success: false,
        message: "At least one field must be provided for update",
      });
    }

    // Verify the form exists and user has access
    const form = await formService.getFormById(formId);
    if (!form) {
      return res
        .status(404)
        .json({ success: false, message: "Form not found" });
    }

    if (form.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update questions for this form",
      });
    }

    // Check if the question exists and belongs to the form
    const question = await questionService.getQuestionById(questionId);
    if (!question) {
      return res
        .status(404)
        .json({ success: false, message: "Question not found" });
    }

    if (question.formId !== formId) {
      return res.status(400).json({
        success: false,
        message: "Question does not belong to this form",
      });
    }

    // Validate the update data
    const validationResult = validateQuestionUpdate(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationResult.errors,
      });
    }

    // Update the question
    if (validationResult.data) {
      const updatedQuestion = await questionService.updateQuestion(
        questionId,
        validationResult.data
      );
      return res.json({ success: true, data: updatedQuestion });
    }
  } catch (error) {
    next(error);
  }
};

export const deleteQuestionController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const formId = req.params.formId;
    const questionId = req.params.id;
    const userId = req.user?.id;

    // Verify the form exists and user has access
    const form = await formService.getFormById(formId);
    if (!form) {
      return res
        .status(404)
        .json({ success: false, message: "Form not found" });
    }

    if (form.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete questions from this form",
      });
    }

    // Check if the question exists and belongs to the form
    const question = await questionService.getQuestionById(questionId);
    if (!question) {
      return res
        .status(404)
        .json({ success: false, message: "Question not found" });
    }

    console.log(question, "found question");

    if (question.formId !== formId) {
      return res.status(400).json({
        success: false,
        message: "Question does not belong to this form",
      });
    }

    // Delete the question
    const deleted = await questionService.deleteQuestion(questionId);
    if (!deleted) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to delete question" });
    }

    return res.json({
      success: true,
      message: "Question deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const reorderQuestionsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const formId = req.params.formId;
    const userId = req.user?.id;

    // Verify the form exists and user has access
    const form = await formService.getFormById(formId);
    if (!form) {
      return res
        .status(404)
        .json({ success: false, message: "Form not found" });
    }

    if (form.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to reorder questions for this form",
      });
    }

    // Validate the request body
    const validationResult = validateQuestionReorder(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationResult.errors,
      });
    }

    // Get all questions for the form to validate questionIds
    const existingQuestions = await questionService.getQuestionsByForm(formId);
    const existingQuestionIds = existingQuestions.map((q) => q.id);

    // Check if all question IDs in the request belong to the form
    const invalidIds = validationResult?.data?.questionIds.filter(
      (id) => !existingQuestionIds.includes(id)
    );
    if (invalidIds?.length && invalidIds?.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Some question IDs do not belong to this form: ${invalidIds.join(
          ", "
        )}`,
      });
    }

    // Check if all form questions are included
    if (
      validationResult?.data?.questionIds.length !== existingQuestions.length
    ) {
      return res.status(400).json({
        success: false,
        message: `Reordering must include all ${existingQuestions.length} questions from the form`,
      });
    }

    // Reorder the questions
    const success = await questionService.reorderQuestions(
      formId,
      validationResult.data.questionIds
    );
    if (!success) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to reorder questions" });
    }

    // Get the updated questions
    const updatedQuestions = await questionService.getQuestionsByForm(formId);
    return res.json({
      success: true,
      message: "Questions reordered successfully",
      data: updatedQuestions,
    });
  } catch (error) {
    next(error);
  }
};
