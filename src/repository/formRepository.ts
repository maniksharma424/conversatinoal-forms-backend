// FormRepository.ts
import { Repository } from "typeorm";

import { AppDataSource } from "../config/data-source.js";
import { Form } from "../entities/formEntity.js";

export class FormRepository {
  private repository: Repository<Form>;

  constructor() {
    this.repository = AppDataSource.getRepository(Form);
  }

  async findById(id: string, isPublic = false): Promise<Form | null> {
    const queryOptions: any = {
      where: { id },
    };

    // Only include questions relation if not public
    if (!isPublic) {
      queryOptions.relations = ["questions"];
    }

    // If public, select all columns except userId
    if (isPublic) {
      queryOptions.select = [
        "id",
        "title",
        "description",
        "tone",
        "isPublished",
        "publishedUrl",
        "createdAt",
        "updatedAt",
      ];
    }

    return this.repository.findOne(queryOptions);
  }

  async findByUser(userId: string): Promise<Form[]> {
    return this.repository.find({
      where: { user: { id: userId } },
      order: { createdAt: "DESC" },
    });
  }

  async findPublishedForm(publishedUrl: string): Promise<Form | null> {
    return this.repository.findOne({
      where: { publishedUrl, isPublished: true },
      relations: ["questions"],
    });
  }

  async create(formData: Partial<Form>): Promise<Form> {
    const form = this.repository.create(formData);
    return this.repository.save(form);
  }

  async update(id: string, formData: Partial<Form>): Promise<Form | null> {
    await this.repository.update(id, formData);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return !!result.affected && result.affected > 0;
  }

  async publish(id: string, publishedUrl: string): Promise<Form | null> {
    await this.repository.update(id, { isPublished: true, publishedUrl });
    return this.findById(id);
  }

  async unpublish(id: string): Promise<Form | null> {
    await this.repository.update(id, {
      isPublished: false,
    });
    return this.findById(id);
  }
}
