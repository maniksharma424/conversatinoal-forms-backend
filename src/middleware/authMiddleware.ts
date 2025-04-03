import { Request, Response, NextFunction } from "express";

import { User } from "../entities/userEntity.js";
import authService from "../services/authService.js";

// No need to create a custom interface since we've extended Express.User
// But if you need additional properties, you can still define it
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Get the token from the request header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized - No token provided" });
    return;
  }

  // Extract the token
  const token = authHeader.split(" ")[1];

  // Verify the token and get the user
  authService
    .verifyToken(token)
    .then((user) => {
      if (!user) {
        res.status(401).json({ message: "Unauthorized - Invalid token" });
        return;
      }

      // Attach the user to the request object
      req.user = user;
      next();
    })
    .catch((error) => {
      console.error("Authentication error:", error);
      res.status(500).json({ message: "Internal server error" });
    });
};

export const requireVerified = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!(req.user as User)?.isVerified) {
    res.status(403).json({ message: "Access denied - Email not verified" });
    return;
  }
  next();
};
