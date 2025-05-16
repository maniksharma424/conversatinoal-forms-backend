import { Request, Response, NextFunction } from "express";
import DodoPayments from "dodopayments";
import {
  CreatePaymentLinkInput,
  validateCreatePaymentLink,
} from "@/validators/paymentLinkValidator.js";
import { UserRepository } from "@/repository/userRepository.js";
import { TransactionRepository } from "@/repository/transactionRepository.js";
import { ProductRepository } from "@/repository/productRepository.js";

const userRepository = new UserRepository();
const transactionRepository = new TransactionRepository();
const productRepository = new ProductRepository();

export const createPaymentLinkController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    // Validate request body
    const validationResult = validateCreatePaymentLink(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationResult.errors?.errors,
      });
    }
    const input: CreatePaymentLinkInput = validationResult.data!;

    // Get user ID and customer ID from authenticated user

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        error: "Unauthorized: User not authenticated ",
      });
    }

    let user = await userRepository.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }
    let product = await productRepository.findByDodoPaymentsProductId(
      input.product_cart[0].product_id
    );
    if (!product) {
      return res.status(404).json({
        error: "Product not found",
      });
    }

    // Initialize DodoPayments client
    const client = new DodoPayments({
      bearerToken: process.env.DODO_PAYMENTS_API_KEY,
    });

    // Create payment link
    const payment = await client.payments.create({
      billing: input.billing,
      customer: {
        customer_id: user.dodopaymentsCustomerId,
        email: input.email || user.email,
        name: input.name || `${user.firstName} ${user.lastName}`,
      },
      product_cart: input.product_cart,
      metadata: input.metadata,
    });

    // Structure the response
    if (payment.payment_link) {
      const response = {
        client_secret: payment.client_secret,
        customer: {
          customer_id: payment.customer.customer_id,
          email: payment.customer.email,
          name: payment.customer.name,
        },
        discount_id: payment.discount_id || null,
        metadata: payment.metadata || {},
        payment_id: payment.payment_id,
        payment_link: payment.payment_link,

        total_amount: payment.total_amount,
      };
      console.log(response);
      await transactionRepository.create({
        user: user,
        dodoPaymentTransactionId: payment.payment_id,
        amountPaid: payment.total_amount,
        paymentStatus: "pending",
        product: product,
        conversationsPurchased: product.conversationCount,
        billingDetails: input.billing,
      });

      return res
        .status(200)
        .json({ success: true, paymentLink: payment.payment_link });
    }
  } catch (error) {
    console.log("Error creating payment link:", error);
    next(error);
  }
};
