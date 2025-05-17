import { Request, Response, NextFunction } from "express";
import {
  CreatePaymentLinkInput,
  validateCreatePaymentLink,
} from "@/validators/paymentLinkValidator.js";
import { PaymentService } from "@/services/paymentService.js";

const paymentService = new PaymentService();

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

    // Verify user authentication
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        error: "Unauthorized: User not authenticated",
      });
    }

    // Call service to create payment link
    const result = await paymentService.createPaymentLink(req.user.id, {
      billing: input.billing,
      product_cart: input.product_cart,
      metadata: input.metadata,
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        paymentLink: null,
        error:
          result.paymentLink === undefined
            ? "Unable to generate payment link please try again"
            : "Invalid user or product",
      });
    }

    return res.status(200).json({
      success: true,
      paymentLink: result.paymentLink,
    });
  } catch (error: any) {
    console.log("Error creating payment link:", error);
    next(error);
  }
};

export const listPaymentProductsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  const env = req.query.env as string;
  const testProducts = env === "test" ? true : false;
  try {
    const products = await paymentService.listPaymentProducts(testProducts);
    return res.status(200).json({
      success: true,
      products,
    });
  } catch (error: any) {
    console.log("Error fetching payment products:", error);
    next(error);
  }
};
