import { DataSource } from "typeorm";
import {
  User,
  Form,
  Question,
  FormResponse,
  QuestionResponse,
  Conversation,
  ConversationMessage,
} from "../entities/index";
import { ENV } from "./env";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: ENV.DB_HOST,
  port: parseInt(ENV.DB_PORT),
  username: ENV.DB_USERNAME,
  password: ENV.DB_PASSWORD,
  database: ENV.DB_DATABASE,
  synchronize: false, // Set to false in production
  logging: ENV.NODE_ENV === "dev",
  entities: [
    User,
    Form,
    Question,
    FormResponse,
    QuestionResponse,
    Conversation,
    ConversationMessage,
  ],
  subscribers: [],
  ssl:
    ENV.NODE_ENV === "prod"
      ? {
          rejectUnauthorized: false,
        }
      : false,
});
