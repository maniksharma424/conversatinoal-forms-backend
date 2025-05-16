import { NextFunction, Request, Response } from "express";
import { Webhook } from "standardwebhooks";

import { PaymentStatus, Transaction } from "../entities/transactionEntity.js";
import { TransactionRepository } from "@/repository/transactionRepository.js";

// Initialize the webhook verifier with your Dodo Payments webhook secret key
// const webhook = new Webhook(process.env.DODO_PAYMENTS_WEBHOOK_KEY || "");
// Initialize TransactionRepository
const transactionRepo = new TransactionRepository();
export const dodoPaymentsWebhookController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  // try {
  //   // Extract webhook headers for verification
  //   const webhookHeaders = {
  //     "webhook-id": req.headers["webhook-id"] as string,
  //     "webhook-signature": req.headers["webhook-signature"] as string,
  //     "webhook-timestamp": req.headers["webhook-timestamp"] as string,
  //   };

  //   // Verify the webhook signature
  //   const rawBody = JSON.stringify(req.body);
  //   await webhook.verify(rawBody, webhookHeaders);

  //   // Extract payload
  //   const payload = req.body;
  //   console.log(payload, "dodo webhook payload");

  //   // Validate required fields
  //   if (!payload.payment_id || !payload.status || !payload.metadata) {
  //     return res
  //       .status(400)
  //       .json({ error: "Missing required fields in webhook payload" });
  //   }

  //   // Extract userId from metadata
  //   const userId = payload.metadata.userId;
  //   if (!userId) {
  //     return res.status(400).json({ error: "userId not found in metadata" });
  //   }

    // // Find the transaction by dodoPaymentTransactionId (payment_id)
    // const transaction = await transactionRepo.repository.findOne({
    //   where: { dodoPaymentTransactionId: payload.payment_id },
    //   relations: ["user", "product"],
    // });

    // if (!transaction) {
    //   return res.status(404).json({
    //     error: "Transaction not found for payment_id: " + payload.payment_id,
    //   });
    // }

    // // Verify userId matches the transaction
    // if (transaction.userId !== userId) {
    //   return res.status(403).json({
    //     error: "userId in metadata does not match transaction userId",
    //   });
    // }

    // // Map webhook status to PaymentStatus enum
    // let paymentStatus: PaymentStatus;
    // switch (payload.status) {
    //   case "succeeded":
    //     paymentStatus = PaymentStatus.SUCCESSFUL;
    //     break;
    //   case "failed":
    //     paymentStatus = PaymentStatus.FAILED;
    //     break;
    //   case "cancelled":
    //   case "requires_customer_action":
    //   case "requires_merchant_action":
    //   case "requires_payment_method":
    //   case "requires_confirmation":
    //   case "requires_capture":
    //   case "partially_captured":
    //   case "partially_captured_and_capturable":
    //   case "processing":
    //     paymentStatus = payload.status as PaymentStatus;
    //     break;
    //   default:
    //     return res
    //       .status(400)
    //       .json({ error: "Invalid payment status: " + payload.status });
    // }

    // // Prepare transaction update data
    // const updateData: Partial<Transaction> = {
    //   paymentStatus,
    //   amountPaid: payload.total_amount
    //     ? payload.total_amount / 100
    //     : transaction.amountPaid, // Convert to dollars (smallest unit to decimal)
    //   billingDetails: {
    //     billing: payload.billing,
    //     customer: payload.customer,
    //     settlement_amount: payload.settlement_amount,
    //     settlement_currency: payload.settlement_currency,
    //     tax: payload.tax,
    //     payment_method: payload.payment_method,
    //     payment_method_type: payload.payment_method_type,
    //     card_details: {
    //       card_last_four: payload.card_last_four,
    //       card_network: payload.card_network,
    //       card_type: payload.card_type,
    //       card_issuing_country: payload.card_issuing_country,
    //     },
    //     discount_id: payload.discount_id,
    //     error_message: payload.error_message,
    //     product_cart: payload.product_cart,
    //     disputes: payload.disputes,
    //     refunds: payload.refunds,
    //   },
    // };

    // // Set paymentCompletedAt if status is successful
    // if (paymentStatus === PaymentStatus.SUCCESSFUL) {
    //   updateData.paymentCompletedAt = new Date(
    //     payload.updated_at || Date.now()
    //   );
    // }

    // // Update the transaction
    // await transactionRepo.update(transaction.id, updateData);

    // Respond with 200 to acknowledge receipt
  //   return res.status(200).json({ received: true });
  // } catch (error) {
  //   next(error);
  // }
};
