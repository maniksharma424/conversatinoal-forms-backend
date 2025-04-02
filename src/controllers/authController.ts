import { Request, Response } from "express";

import { User } from "../entities/userEntity.js";
import { ENV } from "../config/env.js";
import authService from "../services/authService.js";

interface AuthenticatedRequest extends Request {
  user?: User;
}

export const googleCallback = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // User information is available in req.user after successful authentication
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: "Authentication failed" });
      return;
    }

    // Generate JWT token
    const token = authService.generateToken(user);
    const refreshToken = authService.generateRefreshToken(user);

    // Redirect to frontend with token
    res.redirect(
      `${ENV.FRONTEND_URL}/auth-success?token=${token}&refreshToken=${refreshToken}`
    );
  } catch (error) {
    console.error("Google auth callback error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // User is attached to req by the auth middleware
    const user = req.user;

    if (!user) {
      res.status(401).json({ message: "User not authenticated" });
      return;
    }

    // Don't return sensitive information
    const userProfile = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    };

    res.status(200).json(userProfile);
  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const refreshAccessToken = (req: Request, res: Response): void => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ message: "Refresh token is required" });
      return;
    }

    // Use Promise handling inside the function instead of making the function async
    authService
      .refreshToken(refreshToken)
      .then((result) => {
        if (!result) {
          res.status(401).json({ message: "Invalid or expired refresh token" });
          return;
        }
        res.status(200).json({ accessToken: result.accessToken });
      })
      .catch((error) => {
        console.error("Token refresh error:", error);
        res.status(500).json({ message: "Internal server error" });
      });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
