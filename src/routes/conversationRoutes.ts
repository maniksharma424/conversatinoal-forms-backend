import { Router } from "express";

import {
  chatController,
  restoreConversationController,
  testStreamController,
} from "@/controllers/conversationController.js";

const conversationRoutes = Router();

// test stream response route
conversationRoutes.post("/test/stream", testStreamController);

conversationRoutes.post("/chat/:formId", chatController);

conversationRoutes.get("/conversation/restore", restoreConversationController);

export default conversationRoutes;
