import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Form } from "./formEntity.js";
import { Transaction } from "./transactionEntity.js";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ default: false })
  isVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Form, (form) => form.user)
  forms: Form[];

  // New field for available conversation count
  @Column({ default: 20 })
  conversationCount: number;

  // New relationship to transactions
  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions: Transaction[];
}
