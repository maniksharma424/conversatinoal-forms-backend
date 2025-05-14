import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
  CreateDateColumn,
  Relation,
  JoinColumn,
} from "typeorm";
import { FormResponse } from "./formResponseEntity.js";
import { ConversationMessage } from "./conversationMessageEntity.js";

// In Conversation entity (conversation.entity.ts)
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

  @OneToOne(() => FormResponse, (formResponse) => formResponse.conversation, {
    cascade: true,
    onDelete: "CASCADE",
  })
  @JoinColumn() // Makes Conversation the owning side
  formResponse: Relation<FormResponse>;

  @OneToMany(() => ConversationMessage, (message) => message.conversation)
  messages: Relation<ConversationMessage[]>;

  @Column({ type: "text", nullable: true })
  summary: string;
}
