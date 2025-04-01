import { Router } from "express";
import { getAllFormsController } from "src/controllers/formController";


const formRoutes = Router();

formRoutes.get("/forms", getAllFormsController);

export default formRoutes;
