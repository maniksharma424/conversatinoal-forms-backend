import { createPaymentLinkController } from "@/controllers/paymentController.js";
import { Router } from "express";

const paymentRoutes = Router();

paymentRoutes.post(
  "/payments/create-payment-link",
  createPaymentLinkController
);

export default paymentRoutes;
