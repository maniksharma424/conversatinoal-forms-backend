import { listPaymentProductsController } from "@/controllers/paymentController.js";
import { Router } from "express";

const productRoutes = Router();

// list payment products
productRoutes.get("/payments/products",listPaymentProductsController);

export default productRoutes;
