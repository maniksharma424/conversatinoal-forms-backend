import { Router } from "express";

import {
  refreshAccessToken,
  googleOAuthHandler,
  googleOAuthCallbackHandler,
} from "../controllers/authController.js";

const authRoutes = Router();

// Initiate Google OAuth flow
authRoutes.get("/oauth/google", googleOAuthHandler);

// Google OAuth callback route
authRoutes.get("/auth/google/callback", googleOAuthCallbackHandler);

// Token refresh route
authRoutes.post("/auth/refresh-token", refreshAccessToken);

export default authRoutes;
