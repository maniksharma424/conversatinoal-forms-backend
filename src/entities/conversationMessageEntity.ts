import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { Conversation } from "./conversationEntity";

@Entity()
export class ConversationMessage {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "text" })
  content: string;

  @Column()
  role: string; // 'system', 'assistant', 'user'

  @CreateDateColumn()
  timestamp: Date;

  @Column({ nullable: true })
  questionId: string; // Reference to the question being answered, if applicable

  @Column()
  conversationId: string;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "conversationId" })
  conversation: Conversation;
}
