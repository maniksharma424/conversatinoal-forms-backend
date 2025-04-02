// src/scripts/test-connection.ts
import { AppDataSource } from "../config/data-source.js";

async function testConnection() {
  try {
    // Initialize the data source
    await AppDataSource.initialize();
    console.log("✅ Database connection successful!");
    console.log("Connection details:");
    console.log(`- Host: ${AppDataSource.options}`);
    console.log(`- Database: ${AppDataSource.options.database}`);


    // Check if we can execute a simple query
    const result = await AppDataSource.query("SELECT NOW() as time");
    console.log("Query result:", result);
  } catch (error) {
    console.error("❌ Database connection failed:");
    console.error(error);
  } finally {
    // Close the connection if it was established
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log("Connection closed.");
    }
  }
}

// Run the test
testConnection();
