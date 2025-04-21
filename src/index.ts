import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { AppDataSource } from "./config/data-source.js";

import formRoutes, { publicFormRoutes } from "./routes/formRoutes.js";
import { ENV } from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";

import userRoutes from "./routes/userRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import formResponseRoutes from "./routes/responseRoutes.js";
import cookieParser from "cookie-parser";


// Initialize Express app
const app = express();
const PORT = ENV.PORT || "3000";

// Middleware
// CORS configuration with multiple allowed origins
app.use(cors({
  origin: function(origin, callback) {
    // List all origins that should be allowed to access your API
    const allowedOrigins = [
      ENV.FRONTEND_URL ||
        "https://conversational-forms-govp.vercel.app",
      "http://localhost:3000",
      "http://localhost:3001",
      // Add any other origins that need access
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Optional: log blocked origins for debugging
      console.log(`Origin blocked: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

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

// ------- Public Routes --------

// auth routes
app.use("/api/v1", authRoutes);

// public form routes
app.use("/api/v1", publicFormRoutes);

// conversation routes
app.use("/api/v1", conversationRoutes);

// ---- authneticated routes ----

// user routes
app.use("/api/v1", userRoutes);

// form routes
app.use("/api/v1", formRoutes);

// question routes
app.use("/api/v1", questionRoutes);



// form response routes
app.use("/api/v1", formResponseRoutes);

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
