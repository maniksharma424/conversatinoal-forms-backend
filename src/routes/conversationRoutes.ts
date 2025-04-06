import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {} from "../controllers/formController.js";
import {
  chatController,
  testStreamController,
} from "@/controllers/conversationController.js";

const conversationRoutes = Router();

// Apply authentication middleware to all conversation routes
conversationRoutes.use(authenticate);

// test stream response route
conversationRoutes.post("/test/stream", testStreamController);

conversationRoutes.get("/chat/:formId", chatController);

export default conversationRoutes;
