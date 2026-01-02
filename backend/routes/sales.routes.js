import express from "express";
import { addSale, getSales, deleteSale } from "../controllers/sales.controller.js";

const router = express.Router();

router.post("/", addSale);
router.get("/", getSales);
router.delete("/:id", deleteSale);

export default router;
