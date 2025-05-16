import { DataSource } from "typeorm";
import {
  User,
  Form,
  Question,
  FormResponse,
  QuestionResponse,
  Conversation,
  ConversationMessage,
  Product,
  Transaction,
} from "../entities/index.js";
import { ENV } from "./env.js";

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
    Product,
    Transaction
  ],
//   migrations: [
//   // Make sure your migrations are listed or globbed here
//   "src/migration/*.ts"  // or something similar
// ],
  subscribers: [],
  ssl:
    ENV.NODE_ENV === "prod"
      ? {
          rejectUnauthorized: false,
        }
      : false,
});
