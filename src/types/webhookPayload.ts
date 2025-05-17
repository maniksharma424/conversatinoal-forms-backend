export interface WebhookPayload {
  billing: {
    city: string;
    country: string;
    state: string;
    street: string;
    zipcode: string;
  };
  business_id: string;
  card_issuing_country: string;
  card_last_four: string;
  card_network: string;
  card_type: string;
  created_at: string;
  currency: string;
  customer: {
    customer_id: string;
    email: string;
    name: string;
  };
  discount_id?: string;
  disputes: Array<{
    amount: string;
    business_id: string;
    created_at: string;
    currency: string;
    dispute_id: string;
    dispute_stage: string;
    dispute_status: string;
    payment_id: string;
    remarks: string;
  }>;
  error_message?: string;
  metadata: {
    userId?: string;
    [key: string]: any;
  };
  payment_id: string;
  payment_link: string;
  payment_method: string;
  payment_method_type: string;
  product_cart: Array<{
    product_id: string;
    quantity: number;
  }>;
  refunds: Array<{
    amount: number;
    business_id: string;
    created_at: string;
    currency: string;
    payment_id: string;
    reason: string;
    refund_id: string;
    status: string;
  }>;
  settlement_amount: number;
  settlement_currency: string;
  settlement_tax: number;
  status: string;
  subscription_id?: string;
  tax: number;
  total_amount: number;
  updated_at: string;
}
