import { COUNTRY_CODES } from "@/constants/constants.js";
import { z } from "zod";


// Schema for billing details
const billingSchema = z.object({
  city: z.string().min(1, "City is required"),
  country: z.enum(COUNTRY_CODES, {
    errorMap: () => ({
      message: `Country must be one of: ${COUNTRY_CODES.join(", ")}`,
    }),
  }),
  state: z.string().min(1, "State is required"),
  street: z.string().min(1, "Street is required"),
  zipcode: z.string().min(1, "Zipcode is required"),
});

// Schema for product cart items
const productCartItemSchema = z.object({
  product_id: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

// Schema for creating a payment link
export const createPaymentLinkSchema = z
  .object({
    billing: billingSchema,
    product_cart: z
      .array(productCartItemSchema)
      .min(1, "At least one product is required"),
    email: z.string().email("Invalid email format").optional(),
    name: z.string().min(1, "Name is required").optional(),
    discount_id: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  })
  .strict()
  .refine(
    (data) => {
      // Ensure billing and product_cart are provided
      return data.billing && data.product_cart.length > 0;
    },
    {
      message: "Billing and at least one product in product_cart are required",
    }
  );

// Type for the validated input
export type CreatePaymentLinkInput = z.infer<typeof createPaymentLinkSchema>;

// Validation function for creating a payment link
export const validateCreatePaymentLink = (
  data: unknown
): {
  success: boolean;
  data?: CreatePaymentLinkInput;
  errors?: z.ZodError<CreatePaymentLinkInput>;
} => {
  try {
    const validatedData = createPaymentLinkSchema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
};
