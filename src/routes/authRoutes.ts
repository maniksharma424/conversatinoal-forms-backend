import { Router } from "express";
import {

  refreshAccessToken,
  getUserProfile,
  googleOAuthHandler,
  googleOAuthCallbackHandler,
} from "../controllers/authController.js";
import { authenticate, requireVerified } from "../middleware/authMiddleware.js";

const authRoutes = Router();

// Initiate Google OAuth flow
authRoutes.get("/oauth/google", googleOAuthHandler);

// Google OAuth callback route
authRoutes.get("/auth/google/callback", googleOAuthCallbackHandler);

// Token refresh route
authRoutes.post("/auth/refresh-token", refreshAccessToken);

// Protected route to get user profile
authRoutes.get("/auth/user", authenticate, getUserProfile);

// Example of a route requiring a verified email
authRoutes.get("/protected", authenticate, requireVerified, (req, res) => {
  const user = req.user as any;
  res.json({ message: "This is a protected route", user: user?.email });
});

export default authRoutes;
