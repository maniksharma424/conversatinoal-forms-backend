// transactionEntity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./userEntity.js";
import { Product } from "./productEntity.js";

// Payment status enum
export enum PaymentStatus {
  PENDING = "pending",
  SUCCESSFUL = "successful",
  FAILED = "failed",
}

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, (user) => user.transactions)
  @JoinColumn({ name: "userId" })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Product, (product) => product.transactions)
  @JoinColumn({ name: "productId" })
  product: Product;

  @Column()
  productId: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amountPaid: number;

  @Column()
  conversationsPurchased: number;

  @Column({ default: "pending" })
  paymentStatus: string;

  @Column({ nullable: true })
  dodoPaymentTransactionId: string;

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
