import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { AppDataSource } from "./config/data-source.js";

import formRoutes from "./routes/formRoutes.js";
import { ENV } from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";

import userRoutes from "./routes/userRoutes.js";

// Initialize Express app
const app = express();
const PORT = ENV.PORT || "3000";

// Middleware
app.use(cors());
app.use(express.json());

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "dev" ? err.message : undefined,
  });
});

// Routes

// auth routes
app.use("/api/v1", authRoutes);

// user routes
app.use("/api/v1", userRoutes);

// form routes
app.use("/api/v1", formRoutes);

// Health check route
app.get("/", async (req: Request, res: Response) => {
  res.json({ message: "Working" });
});

async function startServer() {
  try {
    // Initialize TypeORM connection

    await AppDataSource.initialize();
    console.log("Database connection established");

    // Start Express server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${ENV.NODE_ENV}`);
    });
  } catch (error) {
    console.error("Error during application startup:", error);
    process.exit(1);
  }
}

// Handle unexpected errors
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

// Start the server
startServer();
