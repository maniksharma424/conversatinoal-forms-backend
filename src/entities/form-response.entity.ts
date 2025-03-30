import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { Form } from "./form.entity";

import { Conversation } from "./conversation.entity";
import { QuestionResponse } from "./question-response";

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
  form: Form;

  @OneToMany(
    () => QuestionResponse,
    (questionResponse) => questionResponse.formResponse
  )
  questionResponses: QuestionResponse[];

  @Column({ nullable: true })
  conversationId: string;

  @OneToOne(() => Conversation, (conversation) => conversation.formResponse)
  @JoinColumn({ name: "conversationId" })
  conversation: Conversation;
}
