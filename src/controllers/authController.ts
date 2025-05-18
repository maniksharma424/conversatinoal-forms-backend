import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { ENV } from "../config/env.js";
import authService from "../services/authService.js";
import { UserRepository } from "../repository/userRepository.js";
import DodoPayments from "dodopayments";


// Initialize OAuth2Client with your credentials and redirect URL
const client = new OAuth2Client(
  ENV.GOOGLE_CLIENT_ID,
  ENV.GOOGLE_CLIENT_SECRET,
  ENV.GOOGLE_CALLBACK_URL
);

const userRepository = new UserRepository();

/**
 * Redirects the user to Google's consent screen.
 */
export const googleOAuthHandler = (req: Request, res: Response) => {
  const url = client.generateAuthUrl({
    access_type: "offline", // gets refresh token
    scope: ["profile", "email"],
  });
  res.redirect(url);
};

/**
 * Handles the callback from Google after user consent.
 */
export const googleOAuthCallbackHandler = async (
  req: Request,
  res: Response
) => {
  const code = req.query.code as string;

  if (!code) {
    res.status(400).send("Missing authorization code.");
    return;
  }

  try {
    // Exchange code for tokens
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // Verify the ID token and extract user info
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token as string,
      audience: ENV.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      res.status(400).send("Unable to retrieve user email from Google.");
      return;
    }

    const email = payload.email;
    let user = await userRepository.findByEmail(email);

    if (!user) {
      const client = new DodoPayments({
        bearerToken: ENV.DODO_PAYMENTS_API_KEY,
        baseURL: ENV.DODO_PAYMENTS_BASE_URL,
      });

      const customer = await client.customers.create({
        email: email,
        name: payload.given_name || "",
      });

      // Create a new user if one does not exist
      user = await userRepository.create({
        email: email,
        passwordHash: email, // As per your requirement, storing email as password (not recommended for production)
        firstName: payload.given_name || "",
        lastName: payload.family_name || "",
        isVerified: true, // Users authenticated via Google are automatically verified
        dodopaymentsCustomerId: customer.customer_id, // Store DodoPayments customer ID
        conversationCount: 20,
      });
    }

    // Generate JWT token and refresh token
    const token = authService.generateToken(user);
    const refreshToken = authService.generateRefreshToken(user);

    // Redirect to frontend with tokens
    res.redirect(
      `${ENV.FRONTEND_URL}/api/auth?token=${token}&refreshToken=${refreshToken}`
    );
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserProfile = async (
  req: Request,
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
      transactions:user.transactions
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
