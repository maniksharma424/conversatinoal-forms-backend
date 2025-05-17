import { NextFunction, Request, Response } from "express";
import { PaymentService } from "@/services/paymentService.js";
import { WebhookPayload } from "@/types/webhookPayload.js";
import { PaymentStatus } from "@/entities/transactionEntity.js";


const paymentService = new PaymentService();

export const dodoPaymentsWebhookController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    // Extract webhook headers for verification
    // const webhookHeaders = {
    //   "webhook-id": req.headers["webhook-id"] as string,
    //   "webhook-signature": req.headers["webhook-signature"] as string,
    //   "webhook-timestamp": req.headers["webhook-timestamp"] as string,
    // };
    //
    // // Verify the webhook signature
    // const rawBody = JSON.stringify(req.body);
    // await Webhook.verify(rawBody, webhookHeaders);

    // Extract and validate payload
    const payload: WebhookPayload = req.body;
    console.log(payload, "dodo webhook payload");

    // Validate required fields
    if (!payload.payment_id || !payload.status || !payload.metadata) {
      return res
        .status(400)
        .json({ error: "Missing required fields in webhook payload" });
    }

    // Extract userId from metadata
    const userId = payload.metadata.userId;
    if (!userId) {
      return res.status(400).json({ error: "userId not found in metadata" });
    }

    // Validate payment status
    if (
      !Object.values(PaymentStatus).includes(payload.status as PaymentStatus)
    ) {
      return res
        .status(400)
        .json({ error: `Invalid payment status: ${payload.status}` });
    }

    // Update transaction via PaymentService
    const success = await paymentService.updateTransactionFromWebhook(
      payload.payment_id,
      userId,
      payload
    );

    if (!success) {
      return res.status(404).json({
        error: `Transaction not found or userId mismatch for payment_id: ${payload.payment_id}`,
      });
    }

    // Respond with 200 to acknowledge receipt
    return res.status(200).json({ received: true });
  } catch (error) {
    console.log("Error processing webhook:", error);
    next(error);
  }
};
