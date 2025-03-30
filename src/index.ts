import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { AppDataSource } from "./config/data-source";
import { ENV } from "./config/env";
import { User, Form, Question, FormResponse } from "@/entities/index";

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
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Form Management API is running" });
});

// User routes
app.get(
  "/api/users",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userRepository = AppDataSource.getRepository(User);
      const users = await userRepository.find({
        select: [
          "id",
          "email",
          "firstName",
          "lastName",
          "isVerified",
          "createdAt",
        ],
      });
      res.json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  }
);

// Form routes
app.get(
  "/api/forms",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const formRepository = AppDataSource.getRepository(Form);
      const forms = await formRepository.find({
        relations: ["user"],
      });
      res.json({ success: true, data: forms });
    } catch (error) {
      next(error);
    }
  }
);

app.get(
  "/api/forms/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const formRepository = AppDataSource.getRepository(Form);
      const form = await formRepository.findOne({
        where: { id: req.params.id },
        relations: ["questions"],
      });

      if (!form) {
        return res
          .status(404)
          .json({ success: false, message: "Form not found" });
      }

      res.json({ success: true, data: form });
    } catch (error) {
      next(error);
    }
  }
);

// Question routes
app.get(
  "/api/forms/:formId/questions",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const questionRepository = AppDataSource.getRepository(Question);
      const questions = await questionRepository.find({
        where: { formId: req.params.formId },
        order: { order: "ASC" },
      });

      res.json({ success: true, data: questions });
    } catch (error) {
      next(error);
    }
  }
);

// Response routes
app.get(
  "/api/forms/:formId/responses",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const responseRepository = AppDataSource.getRepository(FormResponse);
      const responses = await responseRepository.find({
        where: { formId: req.params.formId },
        order: { startedAt: "DESC" },
      });

      res.json({ success: true, data: responses });
    } catch (error) {
      next(error);
    }
  }
);

// Start server function
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
