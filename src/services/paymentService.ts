import DodoPayments from "dodopayments";
import { UserRepository } from "@/repository/userRepository.js";
import { TransactionRepository } from "@/repository/transactionRepository.js";
import { ProductRepository } from "@/repository/productRepository.js";
import { ENV } from "@/config/env.js";
import { WebhookPayload } from "@/types/webhookPayload.js";
import { PaymentStatus, Transaction } from "@/entities/transactionEntity.js";

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
      metadata: { userId: user.id },
      payment_link: true,
      billing_currency:"USD"
    });

    if (!payment.payment_link) {
      return { success: false };
    }

    // Create transaction
    await this.transactionRepository.create({
      user,
      paymentId: payment.payment_id,
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

  async updateTransactionFromWebhook(
    paymentId: string,
    userId: string,
    payload: WebhookPayload
  ): Promise<Transaction | null> {
    // Find the transaction by dodoPaymentTransactionId
    const transaction = await this.transactionRepository.findByPaymentId(
      paymentId
    );

    if (!transaction) {
      return null;
    }

    // Verify userId matches the transaction
    if (transaction.userId !== userId) {
      return null;
    }

    // Map webhook status to PaymentStatus
    const paymentStatus = Object.values(PaymentStatus).includes(
      payload.status as PaymentStatus
    )
      ? (payload.status as PaymentStatus)
      : null;

    if (!paymentStatus) {
      return null;
    }

    // Prepare transaction update data
    const updateData: Partial<any> = {
      billingDetails: {
        billing: payload.billing,
        customer: payload.customer,
        settlement_amount: payload.settlement_amount,
        settlement_currency: payload.settlement_currency,
        tax: payload.tax,
        payment_method: payload.payment_method,
        payment_method_type: payload.payment_method_type,
        card_details: {
          card_last_four: payload.card_last_four,
          card_network: payload.card_network,
          card_type: payload.card_type,
          card_issuing_country: payload.card_issuing_country,
        },
        discount_id: payload.discount_id,
        error_message: payload.error_message,
        product_cart: payload.product_cart,
        disputes: payload.disputes,
        refunds: payload.refunds,
      },
    };

    // Update the transaction
    return this.transactionRepository.update(transaction.id, {
      paymentStatus: paymentStatus,
      billingDetails: updateData.billingDetails,
      paymentCompletedAt:
        paymentStatus === PaymentStatus.SUCCESSFUL ? new Date() : undefined,
      updatedAt: new Date(),
    });
  }
}
