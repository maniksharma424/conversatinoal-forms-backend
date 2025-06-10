import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { AppDataSource } from "./config/data-source.js";

import rateLimit from 'express-rate-limit'; // Added for rate limiting

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
import paymentRoutes from "./routes/paymentRoutes.js";
import productRoutes from "./routes/productRoutes.js";

// Initialize Express app
const app = express();
const PORT = ENV.PORT || "3000";

// Rate limiting middleware with in-memory store
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // Limit each IP to 50 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
  keyGenerator: (req: Request): string => {
    // Use X-Forwarded-For header for IP behind proxies (e.g., AWS ELB)
    const forwardedFor = req.headers["x-forwarded-for"];
    const ipFromHeader = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor;
    return ipFromHeader?.toString() || req.ip || "unknown";
  },
});

// Apply rate limiter to all API routes
app.use('/api/v1', limiter);


// Middleware
const corsOptions = {
  origin: (origin: string | undefined, callback: any) => {
    const allowedOrigins = [
      ENV.FRONTEND_URL,
      "http://localhost:3001", // For local development
      "http://localhost:3000", // For local development,
      "https://conversational-forms-govp.vercel.app",
      "https://www.aiformz.in",
      "https://formly.run",
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

// auth routes
app.use("/api/v1", productRoutes);


// public form routes
app.use("/api/v1", publicFormRoutes);

// conversation routes
app.use("/api/v1", conversationRoutes);

// ---- authneticated routes ----

// user routes
app.use("/api/v1", userRoutes);

// form routes
app.use("/api/v1", formRoutes);

// payment routes
app.use("/api/v1", paymentRoutes);

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
