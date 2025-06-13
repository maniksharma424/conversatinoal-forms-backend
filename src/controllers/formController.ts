// src/controllers/formController.ts
import { NextFunction, Request, Response } from "express";
import { FormService } from "../services/formService.js";
import {
  validateFormCreate,
  validateFormUpdate,
} from "@/validators/formValidators.js";
import { getFormSession } from "@/utils/jwtSession.js";
import { FormResponseService } from "@/services/formResponseService.js";
import { ConversationService } from "@/services/conversationService.js";
import { ENV } from "@/config/env.js";

const formService = new FormService();

// Get form details -  public route controller for form submission
export const getFormDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const formId = req.params.id;
    const form = await formService.getFormById(formId, true); // ispublic = true to fetch public form

    if (!form) {
      return res
        .status(404)
        .json({ success: false, message: "Form not found" });
    }

    // Check if there's an existing session for this form

    const session = getFormSession(req, formId);
    console.log(session, "sessions");
    if (session) {
      const formResponseService = new FormResponseService();
      const conversationService = new ConversationService();

      // Verify the form response exists and is incomplete
      const formResponse = await formResponseService.getResponseById(
        session.responseId
      );

      if (formResponse && !formResponse.completedAt) {
        const conversation =
          await conversationService.getConversationByFormResponse(
            formResponse.id
          );

        if (conversation && conversation.status === "in_progress") {
          // Redirect to restoration page
          return res.status(200).json({
            success: true,
            restoration: {
              available: true,
              responseId: formResponse.id,
              conversationId: conversation.id,
            },
            redirectUrl: `${ENV.FRONTEND_URL}/${formId}restore?action=restore&responseId=${session.responseId}`,
          });
        }
      }
    }

    return res.json({ success: true, data: form });
  } catch (error) {
    next(error);
  }
};


export const getAllFormIds = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    // Fetch all form IDs using the service
    const formIds = await formService.getAllFormIds();

    // Check if formIds is null (as per service return type)
    if (formIds === null) {
      return res.status(404).json({
        success: false,
        message: "No forms found",
      });
    }

    // Return the list of form IDs
    return res.status(200).json({
      success: true,
      data: formIds,
    });
  } catch (error) {
    next(error);
  }
};

// Get all forms for the current user
export const getAllFormsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    // The user ID should be added by the authentication middleware
    const userId = req.user?.id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    const forms = await formService.getAllForms(userId);
    return res.json({ success: true, data: forms });
  } catch (error) {
    next(error);
  }
};

// Create a new form
export const createFormController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "User not authenticated" });
    }

    // Validate form data
    const validationResult = validateFormCreate(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationResult.errors,
      });
    }

    const newForm = await formService.createFormFromPrompt(req.body, userId);
    return res.status(201).json({ success: true, data: newForm });
  } catch (error) {
    next(error);
  }
};

// Get a specific form by ID
export const getFormByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const formId = req.params.id;
    const form = await formService.getFormById(formId);

    if (!form) {
      return res
        .status(404)
        .json({ success: false, message: "Form not found" });
    }

    // Verify the form belongs to the current user
    if (form.userId !== req.user?.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this form",
      });
    }

    return res.json({ success: true, data: form });
  } catch (error) {
    next(error);
  }
};

// Update a form
export const updateFormController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const formId = req.params.id;
    const userId = req.user?.id;

    // Verify the form exists and belongs to the user
    const existingForm = await formService.getFormById(formId);

    if (!existingForm) {
      return res
        .status(404)
        .json({ success: false, message: "Form not found" });
    }
    // Check if the form is published
    if (existingForm.isPublished) {
      return res
        .status(401)
        .json({ success: false, message: "Cannot edit a published form" });
    }

    if (existingForm.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this form",
      });
    }

    // Validate form update data
    const validationResult = validateFormUpdate(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        message: "can not update Unrecognized fields",
      });
    }

    const updatedForm = await formService.updateForm(formId, req.body);
    return res.json({ success: true, data: updatedForm });
  } catch (error) {
    next(error);
  }
};

//Delete a form
export const deleteFormController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const formId = req.params.id;
    const userId = req.user?.id;

    // Verify the form exists and belongs to the user
    const existingForm = await formService.getFormById(formId);

    if (!existingForm) {
      return res
        .status(404)
        .json({ success: false, message: "Form not found" });
    }

    if (existingForm.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this form",
      });
    }

    const deleted = await formService.deleteForm(formId);

    if (!deleted) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to delete form" });
    }

    return res.json({ success: true, message: "Form deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// Publish a form
export const publishFormController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const formId = req.params.id;
    const userId = req.user?.id;

    // Verify the form exists and belongs to the user
    const existingForm = await formService.getFormById(formId);

    if (!existingForm) {
      return res
        .status(404)
        .json({ success: false, message: "Form not found" });
    }

    if (existingForm.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to publish this form",
      });
    }

    // Check if the form is published
    if (existingForm.isPublished) {
      return res
        .status(401)
        .json({ success: false, message: "Cannot publish a published version of a form" });
    }

    const publishedForm = await formService.publishForm(formId);
    return res.json({
      success: true,
      data: publishedForm,
      message: "Form published successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Unpublish a form
export const unpublishFormController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const formId = req.params.id;
    const userId = req.user?.id;

    // Verify the form exists and belongs to the user
    const existingForm = await formService.getFormById(formId);

    if (!existingForm) {
      return res
        .status(404)
        .json({ success: false, message: "Form not found" });
    }

    if (existingForm.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to unpublish this form",
      });
    }

    const unpublishedForm = await formService.unpublishForm(formId);
    return res.json({
      success: true,
      data: unpublishedForm,
      message: "Form unpublished successfully",
    });
  } catch (error) {
    next(error);
  }
};
