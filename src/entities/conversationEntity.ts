import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
  CreateDateColumn,
} from "typeorm";
import { FormResponse } from "./formResponseEntity.js";
import { ConversationMessage } from "./conversationMessageEntity.js";

@Entity()
export class Conversation {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @CreateDateColumn()
  startedAt: Date;

  @Column({ type: "timestamp", nullable: true })
  endedAt: Date;

  @Column({ default: "in_progress" })
  status: string; // 'in_progress', 'completed', 'abandoned'

  @OneToOne(() => FormResponse, (formResponse) => formResponse.conversation)
  formResponse: FormResponse;

  @OneToMany(() => ConversationMessage, (message) => message.conversation)
  messages: ConversationMessage[];
}
