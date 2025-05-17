import DodoPayments from "dodopayments";
import { UserRepository } from "@/repository/userRepository.js";
import { TransactionRepository } from "@/repository/transactionRepository.js";
import { ProductRepository } from "@/repository/productRepository.js";
import { ENV } from "@/config/env.js";

export class PaymentService {
  private userRepository: UserRepository;
  private transactionRepository: TransactionRepository;
  private productRepository: ProductRepository;
  private client: DodoPayments;

  constructor() {
    this.userRepository = new UserRepository();
    this.transactionRepository = new TransactionRepository();
    this.productRepository = new ProductRepository();
    this.client = new DodoPayments({
      bearerToken: ENV.DODO_PAYMENTS_API_KEY,
      baseURL: ENV.DODO_PAYMENTS_BASE_URL,
    });
  }

  async createPaymentLink(
    userId: string,
    input: {
      billing: any;
      product_cart: { product_id: string; quantity: number }[];
      metadata?: any;
    }
  ): Promise<{
    success: boolean;
    paymentLink?: string;
    client_secret?: string;
    customer?: any;
    discount_id?: string | null;
    metadata?: any;
    payment_id?: string;
    total_amount?: number;
  }> {
    // Fetch user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return { success: false };
    }

    // Fetch product
    const product = await this.productRepository.findByDodoPaymentsProductId(
      input.product_cart[0].product_id
    );
    if (!product) {
      return { success: false };
    }

    // Create payment link
    const payment = await this.client.payments.create({
      billing: input.billing,
      customer: {
        customer_id: user.dodopaymentsCustomerId,
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
      },
      product_cart: input.product_cart,
      metadata: input.metadata,
      payment_link: true,
    });

    if (!payment.payment_link) {
      return { success: false };
    }

    // Create transaction
    await this.transactionRepository.create({
      user,
      dodoPaymentTransactionId: payment.payment_id,
      amountPaid: payment.total_amount,
      paymentStatus: "pending",
      product,
      conversationsPurchased: product.conversationCount,
      billingDetails: input.billing,
    });

    return {
      success: true,
      paymentLink: payment.payment_link,
      client_secret: payment.client_secret,
      customer: payment.customer,
      discount_id: payment.discount_id || null,
      metadata: payment.metadata || {},
      payment_id: payment.payment_id,
      total_amount: payment.total_amount,
    };
  }

  async listPaymentProducts(testProducts: boolean): Promise<any[]> {
    try {
      const products = await this.productRepository.findAll(testProducts);
      return products;
    } catch (error) {
      console.error("Error fetching products:", error);
      throw new Error("Unable to fetch products");
    }
    // Fetch products from DodoPayments
  }
}
