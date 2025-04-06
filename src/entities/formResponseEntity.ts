import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  Relation,
} from "typeorm";
import { Form } from "./formEntity.js";

import { Conversation } from "./conversationEntity.js";
import { QuestionResponse } from "./questionResponse.js";

// In FormResponse entity (form-response.entity.ts)
@Entity()
export class FormResponse {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: true })
  respondentEmail: string;

  @Column({ nullable: true })
  respondentName: string;

  @CreateDateColumn()
  startedAt: Date;

  @Column({ type: "timestamp", nullable: true })
  completedAt: Date;

  @Column()
  formId: string;

  @ManyToOne(() => Form, (form) => form.responses)
  @JoinColumn({ name: "formId" })
  form: Relation<Form>;

  @OneToMany(
    () => QuestionResponse,
    (questionResponse) => questionResponse.formResponse
  )
  questionResponses: QuestionResponse[];

  @OneToOne(() => Conversation, (conversation) => conversation.formResponse)
  conversation: Relation<Conversation>;
}
