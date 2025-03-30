import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Question } from "./question.entity";
import { FormResponse } from "./form-response.entity";

@Entity()
export class QuestionResponse {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "text" })
  response: string;

  @Column({ default: 0 })
  retryCount: number;

  @Column()
  questionId: string;

  @ManyToOne(() => Question)
  @JoinColumn({ name: "questionId" })
  question: Question;

  @Column()
  formResponseId: string;

  @ManyToOne(
    () => FormResponse,
    (formResponse) => formResponse.questionResponses,
    { onDelete: "CASCADE" }
  )
  @JoinColumn({ name: "formResponseId" })
  formResponse: FormResponse;
}
