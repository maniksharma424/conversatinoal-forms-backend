import express from "express";
import passport from "passport";

import { authenticate, requireVerified } from "../middleware/authMiddleware.js";
import { User } from "../entities/userEntity.js";
import { getUserProfile, googleCallback, refreshAccessToken } from "../controllers/authController.js";

const router = express.Router();

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  googleCallback
);

// Token refresh route
router.post("/refresh-token", refreshAccessToken);

// Protected route to get user profile
router.get("/profile", authenticate, getUserProfile);

// Example of a route requiring verified email
router.get("/protected", authenticate, requireVerified, (req, res) => {
  const user = req.user as User;
  res.json({ message: "This is a protected route", user: user?.email });
});

export default router;
