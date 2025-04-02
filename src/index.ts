
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { AppDataSource } from "./config/data-source.js";


import { createDeepSeek } from "@ai-sdk/deepseek";
import { generateText, streamText } from "ai";
import formRoutes from "./routes/formRoutes.js";
import { ENV } from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";
import { User } from "./entities/userEntity.js";


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

const deepseek = createDeepSeek({
  apiKey: process.env.DEEPSEEK_API_KEY ?? "",
});

app.use("/api/v1", authRoutes);

app.use("/api/v1", formRoutes);

// Routes
app.get("/", async (req: Request, res: Response) => {
  // const { text } = await generateText({
  //   model: deepseek("deepseek-chat"),
  //   prompt: "Write a vegetarian lasagna recipe for 4 people.",
  // });

  res.json({ message: "Form Management API is   wokring fine" });
});

// // Add a streaming endpoint
// app.get("/stream", async (req: Request, res: Response) => {
//   // Set headers for streaming
//   res.setHeader("Content-Type", "text/event-stream");
//   res.setHeader("Cache-Control", "no-cache");
//   res.setHeader("Connection", "keep-alive");

//   try {
//     const result = streamText({
//       model: deepseek("deepseek-chat"),
//       prompt: "Write a vegetarian lasagna recipe for 4 people.",
//     });

//     // Method 1: Using the helper function
//     // This automatically handles the streaming for you
//     result.pipeTextStreamToResponse(res);

//     // Method 2: Manual streaming (if you need more control)
//     /*
//     for await (const textPart of result.textStream) {
//       res.write(`data: ${JSON.stringify({ text: textPart })}\n\n`);
      
//       // Optional: Force flush the response
//       if (res.flush) res.flush();
//     }
    
//     // End the response when done
//     res.write('data: [DONE]\n\n');
//     res.end();
//     */
//   } catch (error) {
//     console.error("Streaming error:", error);
//     res.write(
//       `data: ${JSON.stringify({
//         error: "An error occurred during streaming",
//       })}\n\n`
//     );
//     res.end();
//   }
// });

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

// // Form routes
// app.get(
//   "/api/forms",
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const formRepository = AppDataSource.getRepository(Form);
//       const forms = await formRepository.find({
//         relations: ["user"],
//       });
//       res.json({ success: true, data: forms });
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// app.get(
//   "/api/forms/:id",
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const formRepository = AppDataSource.getRepository(Form);
//       const form = await formRepository.findOne({
//         where: { id: req.params.id },
//         relations: ["questions"],
//       });

//       if (!form) {
//         return res
//           .status(404)
//           .json({ success: false, message: "Form not found" });
//       }

//       res.json({ success: true, data: form });
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// // Question routes
// app.get(
//   "/api/forms/:formId/questions",
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const questionRepository = AppDataSource.getRepository(Question);
//       const questions = await questionRepository.find({
//         where: { formId: req.params.formId },
//         order: { order: "ASC" },
//       });

//       res.json({ success: true, data: questions });
//     } catch (error) {
//       next(error);
//     }
//   }
// );

// // Response routes
// app.get(
//   "/api/forms/:formId/responses",
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const responseRepository = AppDataSource.getRepository(FormResponse);
//       const responses = await responseRepository.find({
//         where: { formId: req.params.formId },
//         order: { startedAt: "DESC" },
//       });

//       res.json({ success: true, data: responses });
//     } catch (error) {
//       next(error);
//     }
//   }
// );

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
