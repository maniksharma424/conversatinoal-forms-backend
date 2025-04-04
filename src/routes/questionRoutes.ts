// src/routes/questionRoutes.ts
import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  getQuestionsController,
  createQuestionController,
  updateQuestionController,
  deleteQuestionController,
  reorderQuestionsController,
} from "../controllers/questionController.js";

const questionRoutes = Router();

// Apply authentication middleware to all question routes
questionRoutes.use(authenticate);

// Routes for question management
questionRoutes.get("/form/:formId/questions", getQuestionsController);

// create question manually
questionRoutes.post("/form/:formId/question", createQuestionController);

// suggest question from AI by giving context of form and rest of the question after suggestion use create or update question api 
// questionRoutes.post(
//   "/form/:formId/question/generate",
//   createQuestionController
// );

questionRoutes.put("/form/:formId/question/:id", updateQuestionController);

questionRoutes.delete("/form/:formId/question/:id", deleteQuestionController);

questionRoutes.put(
  "/form/:formId/questions/reorder",
  reorderQuestionsController
);

export default questionRoutes;
