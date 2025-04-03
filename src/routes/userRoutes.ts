import { Router } from "express";
import { getUserProfile } from "../controllers/authController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const userRoutes = Router();

// initialise middleware for user routes
userRoutes.use(authenticate);

// Protected route to get user profile

userRoutes.get("/auth/user", getUserProfile);

export default userRoutes;
