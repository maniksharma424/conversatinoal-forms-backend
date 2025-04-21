import jwt from "jsonwebtoken";
import { Response, Request } from "express";
import { ENV } from "@/config/env.js";

// Configuration
const JWT_SECRET = ENV.JWT_SECRET;
const SESSION_COOKIE_NAME = "formSessions";

function generateSessionToken(formId: string, responseId: string): string {
  const payload = {
    formId,
    responseId,
    createdAt: new Date().toISOString(),
  };

  return jwt.sign(payload, JWT_SECRET);
}
export function setFormSessionCookie(
  res: Response,
  formId: string,
  responseId: string
): void {
  // Generate token
  const token = generateSessionToken(formId, responseId);

  // Get existing sessions if any
  console.log(res.req.cookies)
  const existingCookie = res.req.cookies[SESSION_COOKIE_NAME];
  let formSessions = {};

  if (existingCookie) {
    try {
      formSessions = JSON.parse(existingCookie);
    } catch (e) {
      console.error("Error parsing existing cookie:", e);
    }
  }

  // Update with new session
  formSessions = {
    ...formSessions,
    [formId]: token,
  };

  // Set cookie
  res.cookie(SESSION_COOKIE_NAME, JSON.stringify(formSessions), {
    maxAge: 999 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: true, // Required for sameSite "none"
    sameSite: "none",
    path: "/",
  });
}

function verifySessionToken(token: string): {
  formId: string;
  responseId: string;
  createdAt: string;
} | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return {
      formId: decoded.formId,
      responseId: decoded.responseId,
      createdAt: decoded.createdAt,
    };
  } catch (error) {
    console.error("JWT verification error:", error);
    return null;
  }
}

export function getFormSession(
  req: Request,
  formId: string
): {
  responseId: string;
  formId: string;
  createdAt: string;
} | null {
  const cookies = req.cookies;

  if (!cookies || !cookies[SESSION_COOKIE_NAME]) {
    return null;
  }

  try {
    const formSessions = JSON.parse(cookies[SESSION_COOKIE_NAME]);
    if (formSessions) {
      const token = formSessions[formId];

      if (!token) {
        return null;
      }

      return verifySessionToken(token);
    }
    return null;
  } catch (e) {
    console.error("Error retrieving session:", e);
    return null;
  }
}
