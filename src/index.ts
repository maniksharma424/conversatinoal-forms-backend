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
import { scheduleJobs } from "./jobs/summaryGenerator.js";
import webhookRoutes from "./routes/webhookRoutes.js";

// Initialize Express app
const app = express();
const PORT = ENV.PORT || "3000";

// Middleware
const corsOptions = {
  origin: (origin: string | undefined, callback: any) => {
    const allowedOrigins = [
      ENV.FRONTEND_URL,
      "http://localhost:3001", // For local development
      "http://localhost:3000", // For local development,
      "https://conversational-forms-govp.vercel.app",
      "https://www.aiformz.in",
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // Enable credentials (cookies)
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Middleware
app.use(cors(corsOptions));
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

// web hook routes
app.use("/api/v1", webhookRoutes);

// auth routes
app.use("/api/v1", authRoutes);

// payment routes
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
    scheduleJobs();

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
