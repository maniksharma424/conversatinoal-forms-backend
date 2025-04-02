import { getAllFormsController } from "../controllers/formController.js";
import { Router } from "express";



const formRoutes = Router();

formRoutes.get("/forms", getAllFormsController);

export default formRoutes;
