import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Relation,
} from "typeorm";
import { Form } from "./formEntity.js";

@Entity()
export class Question {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "text" })
  text: string;

  @Column({ default: "text" })
  type: string; // 'text', 'multiplechoice', 'number', 'email', etc.

  @Column({ type: "jsonb", nullable: true })
  validationRules: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    options?: string[]; // For multiple-choice questions
  };

  @Column({ default: 0 })
  order: number;

  @Column({ type: "jsonb", nullable: true })
  metadata: {
    description?: string;
    helpText?: string;
    placeholderText?: string;
  };

  @Column()
  formId: string;

  @ManyToOne(() => Form, (form) => form.questions, { onDelete: "CASCADE" })
  @JoinColumn({ name: "formId" })
  form: Relation <Form>;
}
