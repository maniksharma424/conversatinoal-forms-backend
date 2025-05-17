// TransactionRepository.ts
import { Repository, FindOptionsWhere, Between, LessThan } from "typeorm";

import { AppDataSource } from "../config/data-source.js";
import { Transaction } from "../entities/transactionEntity.js";

export class TransactionRepository {
  private repository: Repository<Transaction>;

  constructor() {
    this.repository = AppDataSource.getRepository(Transaction);
  }

  async findById(id: string): Promise<Transaction | null> {
    return this.repository.findOne({
      where: { id },
      relations: ["user", "product"],
    });
  }

  async findByPaymentId(id: string): Promise<Transaction | null> {
    return this.repository.findOne({
      where: { paymentId: id },
      relations: ["user", "product"],
    });
  }

  async findByUser(userId: string): Promise<Transaction[]> {
    return this.repository.find({
      where: { userId },
      relations: ["product"],
      order: { createdAt: "DESC" },
    });
  }

  async findByProduct(productId: string): Promise<Transaction[]> {
    return this.repository.find({
      where: { productId },
      relations: ["user"],
      order: { createdAt: "DESC" },
    });
  }

  async findByPaymentStatus(status: string): Promise<Transaction[]> {
    return this.repository.find({
      where: { paymentStatus: status },
      relations: ["user", "product"],
      order: { createdAt: "DESC" },
    });
  }

  async create(transactionData: Partial<Transaction>): Promise<Transaction> {
    const transaction = this.repository.create(transactionData);
    return this.repository.save(transaction);
  }

  async update(
    id: string,
    transactionData: Partial<Transaction>
  ): Promise<Transaction | null> {
    await this.repository.update(id, transactionData);
    return this.findById(id);
  }

  async updatePaymentStatus(
    id: string,
    status: string,
    completedAt?: Date
  ): Promise<Transaction | null> {
    const updateData: Partial<Transaction> = {
      paymentStatus: status,
    };

    if (status === "successful" && !completedAt) {
      updateData.paymentCompletedAt = new Date();
    } else if (completedAt) {
      updateData.paymentCompletedAt = completedAt;
    }

    await this.repository.update(id, updateData);
    return this.findById(id);
  }

  async updateByDodoPaymentId(
    paymentId: string,
    status: string
  ): Promise<Transaction | null> {
    const transaction = await this.repository.findOne({
      where: { paymentId: paymentId },
    });

    if (!transaction) return null;

    return this.updatePaymentStatus(transaction.id, status);
  }

  async getSuccessfulTransactionsByPeriod(
    startDate: Date,
    endDate: Date
  ): Promise<Transaction[]> {
    return this.repository.find({
      where: {
        paymentStatus: "successful",
        paymentCompletedAt: Between(startDate, endDate),
      },
      relations: ["user", "product"],
      order: { paymentCompletedAt: "DESC" },
    });
  }

  // Helper to get all pending transactions that need to be checked
  async getPendingTransactions(
    olderThanMinutes?: number
  ): Promise<Transaction[]> {
    const whereClause: FindOptionsWhere<Transaction> = {
      paymentStatus: "pending",
    };

    if (olderThanMinutes) {
      const cutoffTime = new Date();
      cutoffTime.setMinutes(cutoffTime.getMinutes() - olderThanMinutes);

      whereClause.createdAt = LessThan(cutoffTime);
    }

    return this.repository.find({
      where: whereClause,
      relations: ["user", "product"],
      order: { createdAt: "ASC" },
    });
  }
}
