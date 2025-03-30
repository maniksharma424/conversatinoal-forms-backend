// src/scripts/create-database.ts
import { Client } from "pg";
import { ENV } from "../config/env";

async function createDatabase() {
  // Connect to the default postgres database
  const client = new Client({
    host: ENV.DB_HOST,
    port: parseInt(ENV.DB_PORT),
    user: ENV.DB_USERNAME,
    password: ENV.DB_PASSWORD,
    database: "postgres", // Connect to default postgres database
    ssl: ENV.NODE_ENV === "prod" ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    console.log("Connected to postgres database");

    // Check if database already exists
    const checkResult = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      ["conversational-forms-db"]
    );

    if (checkResult.rowCount === 0) {
      // Create the database (note: cannot use parameterized query for DB name)
      await client.query(`CREATE DATABASE "conversational-forms-db"`);
      console.log('Database "conversational-forms-db" created successfully');
    } else {
      console.log('Database "conversational-forms-db" already exists');
    }
  } catch (error) {
    console.error("Error creating database:", error);
  } finally {
    await client.end();
  }
}

createDatabase();
