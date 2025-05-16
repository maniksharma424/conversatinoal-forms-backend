// productEntity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Transaction } from "./transactionEntity.js";

@Entity()
export class Product {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  price: number;

  @Column()
  conversationCount: number;

  // New metadata JSON field
  @Column({ type: "jsonb", nullable: true, default: {} })
  metadata: Record<string, any>;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  dodoPaymentProductId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Transaction, (transaction) => transaction.product)
  transactions: Transaction[];
}
