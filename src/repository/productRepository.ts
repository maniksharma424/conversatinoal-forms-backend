// ProductRepository.ts
import { Between, MoreThanOrEqual, Repository } from "typeorm";

import { AppDataSource } from "../config/data-source.js";
import { Product } from "../entities/productEntity.js";

export class ProductRepository {
  private repository: Repository<Product>;

  constructor() {
    this.repository = AppDataSource.getRepository(Product);
  }

  async findById(id: string): Promise<Product | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findAll(testProduct = false): Promise<Product[]> {
    if (testProduct) {
      return this.repository.find({ where: { testProduct: true } });
    }
    return this.repository.find({ where: { testProduct: false } });
  }

  async create(productData: Partial<Product>): Promise<Product> {
    const product = this.repository.create(productData);
    return this.repository.save(product);
  }

  async update(
    id: string,
    productData: Partial<Product>
  ): Promise<Product | null> {
    await this.repository.update(id, productData);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return !!result?.affected && result?.affected > 0;
  }

  //   async setActive(id: string, testProduct: boolean): Promise<Product | null> {
  //     await this.repository.update(id, { testProduct });
  //     return this.findById(id);
  //   }

  // Find products by price range
  async findByPriceRange(
    minPrice: number,
    maxPrice: number,
    testProduct: boolean
  ): Promise<Product[]> {
    return this.repository.find({
      where: {
        price: Between(minPrice, maxPrice),
        testProduct: testProduct ? true : false,
      },
    });
  }

  // Find products by conversation count
  async findByConversationCount(
    minCount: number,
    testProduct: boolean
  ): Promise<Product[]> {
    return this.repository.find({
      where: {
        conversationCount: MoreThanOrEqual(minCount),
        testProduct: testProduct ? true : false,
      },
    });
  }
}
