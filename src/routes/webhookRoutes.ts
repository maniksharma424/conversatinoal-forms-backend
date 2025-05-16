import { Router } from "express";

import { dodoPaymentsWebhookController } from "@/controllers/webhookControllers.js";

const webhookRoutes = Router();

// Dodo payments webhook
webhookRoutes.post("/webhook/dodo-payments", dodoPaymentsWebhookController);

export default webhookRoutes;
