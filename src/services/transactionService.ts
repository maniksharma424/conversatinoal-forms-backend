import { TransactionRepository } from "@/repository/transactionRepository.js";
import { Transaction } from "../entities/transactionEntity.js";

// TransactionService encapsulates business logic for transaction operations
export class TransactionService {
  private transactionRepo: TransactionRepository;

  constructor() {
    this.transactionRepo = new TransactionRepository();
  }

  // Retrieve a transaction by ID
  async getTransactionById(id: string): Promise<Transaction | null> {
    if (!id) {
      throw new Error("Transaction ID is required");
    }
    const transaction = await this.transactionRepo.findById(id);
    if (!transaction) {
      throw new Error(`Transaction with ID ${id} not found`);
    }
    return transaction;
  }

  // Retrieve transactions for a specific user
  async getTransactionsByUser(userId: string): Promise<Transaction[]> {
    if (!userId) {
      throw new Error("User ID is required");
    }
    return this.transactionRepo.findByUser(userId);
  }

  // Retrieve transactions for a specific product
  async getTransactionsByProduct(productId: string): Promise<Transaction[]> {
    if (!productId) {
      throw new Error("Product ID is required");
    }
    return this.transactionRepo.findByProduct(productId);
  }

  // Retrieve transactions by payment status
  async getTransactionsByPaymentStatus(status: string): Promise<Transaction[]> {
    if (!status) {
      throw new Error("Payment status is required");
    }
    return this.transactionRepo.findByPaymentStatus(status);
  }

  // Create a new transaction
  async createTransaction(
    transactionData: Partial<Transaction>
  ): Promise<Transaction> {
    if (
      !transactionData.userId ||
      !transactionData.productId ||
      !transactionData.amountPaid ||
      !transactionData.conversationsPurchased
    ) {
      throw new Error(
        "userId, productId, amountPaid, and conversationsPurchased are required to create a transaction"
      );
    }
    return this.transactionRepo.create(transactionData);
  }

  // Update a transaction with partial data
  async updateTransaction(
    id: string,
    transactionData: Partial<Transaction>
  ): Promise<Transaction> {
    if (!id) {
      throw new Error("Transaction ID is required");
    }
    const transaction = await this.transactionRepo.findById(id);
    if (!transaction) {
      throw new Error(`Transaction with ID ${id} not found`);
    }
    const updatedTransaction = await this.transactionRepo.update(
      id,
      transactionData
    );
    if (!updatedTransaction) {
      throw new Error(`Failed to update transaction with ID ${id}`);
    }
    return updatedTransaction;
  }

  // Update payment status of a transaction
  async updateTransactionPaymentStatus(
    id: string,
    status: string,
    completedAt?: Date
  ): Promise<Transaction> {
    if (!id || !status) {
      throw new Error("Transaction ID and status are required");
    }
    const transaction = await this.transactionRepo.findById(id);
    if (!transaction) {
      throw new Error(`Transaction with ID ${id} not found`);
    }
    const updatedTransaction = await this.transactionRepo.updatePaymentStatus(
      id,
      status,
      completedAt
    );
    if (!updatedTransaction) {
      throw new Error(
        `Failed to update payment status for transaction with ID ${id}`
      );
    }
    return updatedTransaction;
  }

  // Update transaction by Dodo Payment ID
  async updateTransactionByDodoPaymentId(
    dodoPaymentId: string,
    status: string
  ): Promise<Transaction | null> {
    if (!dodoPaymentId || !status) {
      throw new Error("Dodo Payment ID and status are required");
    }
    const transaction = await this.transactionRepo.updateByDodoPaymentId(
      dodoPaymentId,
      status
    );
    if (!transaction) {
      throw new Error(
        `Transaction with Dodo Payment ID ${dodoPaymentId} not found`
      );
    }
    return transaction;
  }

  // Retrieve successful transactions within a date range
  async getSuccessfulTransactionsByPeriod(
    startDate: Date,
    endDate: Date
  ): Promise<Transaction[]> {
    if (!startDate || !endDate) {
      throw new Error("Start date and end date are required");
    }
    if (startDate > endDate) {
      throw new Error("Start date must be before end date");
    }
    return this.transactionRepo.getSuccessfulTransactionsByPeriod(
      startDate,
      endDate
    );
  }

  // Retrieve pending transactions, optionally filtered by age
  async getPendingTransactions(
    olderThanMinutes?: number
  ): Promise<Transaction[]> {
    if (olderThanMinutes && olderThanMinutes <= 0) {
      throw new Error("olderThanMinutes must be a positive number");
    }
    return this.transactionRepo.getPendingTransactions(olderThanMinutes);
  }
}
