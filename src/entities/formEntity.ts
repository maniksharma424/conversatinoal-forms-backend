import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Relation,
  OneToOne,
} from "typeorm";

import { FormResponse } from "./formResponseEntity.js";
import { User } from "./userEntity.js";
import { Question } from "./questionEntity.js";

@Entity()
export class Form {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  title: string;

  @Column({ type: "text" })
  description: string;

  @Column({ default: "neutral" })
  tone: string; // 'friendly', 'formal', 'casual', etc.

  @Column({ default: false })
  isPublished: boolean;

  @Column({ nullable: true })
  publishedUrl: string;

  @Column({ default: 3 })
  maxRetries: number; // Maximum retries for unanswered questions

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.forms)
  @JoinColumn({ name: "userId" })
  user: Relation<User>;

  @OneToMany(() => Question, (question) => question.form)
  questions: Question[];

  @OneToMany(() => FormResponse, (response) => response.form)
  responses: FormResponse[];

  @Column({ type: "jsonb", nullable: true })
  settings: {
    welcomeMessage?: string;
    completionMessage?: string;
    retryMessage?: string;
    theme?: string;
  };

  // Self-relation: Draft form points to its published version
  @OneToOne(() => Form, { nullable: true })
  @JoinColumn({ name: "publishedVersionId" })
  publishedVersion: Relation<Form>;

  @Column({ nullable: true })
  publishedVersionId: string;

  // Self-relation: Published form is pointed to by its draft version
  @OneToOne(() => Form, (form) => form.publishedVersion, { nullable: true })
  draftVersion: Relation<Form>;
  
  @Column({ type: "text", nullable: true })
  summary: string;
}
