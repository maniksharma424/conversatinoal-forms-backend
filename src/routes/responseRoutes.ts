// src/routes/formResponseRoutes.ts
import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { getFormResponseConversationController, getFormResponsesController } from "@/controllers/formResponseController.js";

const formResponseRoutes = Router();

// Apply authentication middleware to all form response routes
formResponseRoutes.use(authenticate);

// Get all responses for a form
formResponseRoutes.get("/form/:formId/responses", getFormResponsesController);

// Get conversation for a specific form response
formResponseRoutes.get(
  "/response/:responseId/conversation",
  getFormResponseConversationController
);

export default formResponseRoutes;
