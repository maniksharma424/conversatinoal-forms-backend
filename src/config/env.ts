import dotenvSafe from "dotenv-safe";
import path from "path";

dotenvSafe.config({
  example: path.join(process.cwd(), ".env.example"),
  path: path.join(process.cwd(), ".env"),
  allowEmptyValues: false, // Do not allow empty variables
});

interface Env {
  NODE_ENV: "dev" | "prod"; // Restrict to 'dev' or 'prod'
  PORT: string;
  DB_HOST: string;
  DB_PORT: string;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_DATABASE: string;
  JWT_SECRET: string;
  REFRESH_JWT_SECRET: string;
  DEEPSEEK_API_KEY: string;
  // Google OAuth settings
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_CALLBACK_URL: string;
  FRONTEND_URL: string;
}

export const ENV: Env = {
  NODE_ENV: (process.env.NODE_ENV as "dev" | "prod") || "dev",
  PORT: process.env.PORT || "3000",
  DB_HOST: process.env.DB_HOST || "",
  DB_PORT: process.env.DB_PORT || "5432",
  DB_USERNAME: process.env.DB_USERNAME || "",
  DB_PASSWORD: process.env.DB_PASSWORD || "",
  DB_DATABASE: process.env.DB_DATABASE || "",
  JWT_SECRET: process.env.JWT_SECRET || "",
  REFRESH_JWT_SECRET: process.env.REFRESH_JWT_SECRET || "",
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || "",
  // Google OAuth settings
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || "",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
};

// Validate required variables
const requiredVars = [
  "NODE_ENV",
  "PORT",
  "DB_HOST",
  "DB_PORT",
  "DB_USERNAME",
  "DB_PASSWORD",
  "DB_DATABASE",
  "JWT_SECRET",
  "REFRESH_JWT_SECRET",
  "DEEPSEEK_API_KEY",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_CALLBACK_URL",
] as const;

requiredVars.forEach((key) => {
  if (!ENV[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

// Validate NODE_ENV
if (ENV.NODE_ENV !== "dev" && ENV.NODE_ENV !== "prod") {
  throw new Error(
    `Invalid value for NODE_ENV: ${ENV.NODE_ENV}. Allowed values are 'dev' or 'prod'.`
  );
}
