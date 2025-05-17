import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Relation,
} from "typeorm";
import { User } from "./userEntity.js";
import { Product } from "./productEntity.js";

// Payment status enum
export enum PaymentStatus {
  SUCCESSFUL = "succeeded",
  FAILED = "failed",
  CANCELLED = "cancelled",
  REQUIRES_CUSTOMER_ACTION = "requires_customer_action",
  REQUIRES_MERCHANT_ACTION = "requires_merchant_action",
  REQUIRES_PAYMENT_METHOD = "requires_payment_method",
  REQUIRES_CONFIRMATION = "requires_confirmation",
  REQUIRES_CAPTURE = "requires_capture",
  PARTIALLY_CAPTURED = "partially_captured",
  PARTIALLY_CAPTURED_AND_CAPTURABLE = "partially_captured_and_capturable",
  PROCESSING = "processing",
}

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, (user: any) => user.transactions)
  @JoinColumn({ name: "userId" })
  user: Relation<User>;

  @Column()
  userId: string;

  @ManyToOne(() => Product, (product: any) => product.transactions)
  @JoinColumn({ name: "productId" })
  product: Relation<Product>;

  @Column()
  productId: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amountPaid: number;

  @Column()
  conversationsPurchased: number;

  @Column({ default: "pending" })
  paymentStatus: string;

  @Column({ nullable: true })
  paymentId: string;

  // Consolidated billing information as JSON
  @Column({ type: "jsonb", nullable: true })
  billingDetails: Record<string, any>;

  // Payment initiated and completed timestamps
  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  paymentCompletedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
