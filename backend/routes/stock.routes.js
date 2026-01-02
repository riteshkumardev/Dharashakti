import express from "express";
import { addPurchase, getStocks, updateStock, deleteStock } from "../controllers/stock.controller.js";

const router = express.Router();
router.post("/", addPurchase); // Isse URL seedhe /api/purchases ban jayega
router.get("/", getStocks);    // Isse URL seedhe /api/stocks ban jayega
router.put("/:id", updateStock);       // Stock edit ke liye
router.delete("/:id", deleteStock);    // Stock delete ke liye

export default router;