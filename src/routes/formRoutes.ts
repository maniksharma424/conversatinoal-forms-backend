import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  createFormController,
  deleteFormController,
  getAllFormIds,
  getAllFormsController,
  getFormByIdController,
  getFormDetails,
  publishFormController,
  unpublishFormController,
  updateFormController,
} from "../controllers/formController.js";

const formRoutes = Router();

export const publicFormRoutes = Router(); // Separate router for public routes

// Define public routes
publicFormRoutes.get("/public/form/:id", getFormDetails);
publicFormRoutes.get("/api/v1/set-session", (req, res) => {
  const SESSION_COOKIE_NAME = "formSessions";
  const formSessions = {
    "testing cookie": "test ran", // Replace with actual data
  };
  res.cookie(SESSION_COOKIE_NAME, JSON.stringify(formSessions), {
    maxAge: 999 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  });
  res.json({ message: "Cookie set" });
});

publicFormRoutes.get("/public/forms/", getAllFormIds);

// Apply authentication middleware to all form routes
formRoutes.use(authenticate);

// Form management routes

// generate form from user prompt
formRoutes.post("/form", createFormController);

// get all forms of a user
formRoutes.get("/forms", getAllFormsController);

// get form details
formRoutes.get("/form/:id", getFormByIdController);

// update a form
formRoutes.put("/form/:id", updateFormController);

// publish a form
formRoutes.put("/form/:id/publish", publishFormController);

// unbpublish a form
formRoutes.put("/form/:id/unpublish", unpublishFormController);

// delete a form
formRoutes.delete("/form/:id", deleteFormController);

export default formRoutes;
