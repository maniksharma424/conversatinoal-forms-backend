// src/services/formResponseService.ts
import { FormResponseRepository } from "../repository/formResponseRepository.js";
import { FormResponse } from "../entities/formResponseEntity.js";
import { QuestionResponse } from "../entities/questionResponse.js";

export interface FormResponseCreate {
  formId: string;
  respondentEmail?: string;
  respondentName?: string;
}

export interface QuestionResponseCreate {
  questionId: string;
  response: string;
  formResponseId: string;
}

export class FormResponseService {
  private formResponseRepository: FormResponseRepository;

  constructor() {
    this.formResponseRepository = new FormResponseRepository();
  }

  async getResponseById(responseId: string): Promise<FormResponse | null> {
    return this.formResponseRepository.findById(responseId);
  }

  async getResponsesByForm(formId: string): Promise<FormResponse[]> {
    return this.formResponseRepository.findByForm(formId);
  }
}
