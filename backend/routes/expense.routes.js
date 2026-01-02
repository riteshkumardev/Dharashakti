import express from "express";
import { addExpense, getExpenses } from "../controllers/expense.controller.js";

const router = express.Router();

// ➕ Add Expense (Yahan pehle addPurchase likha tha, use badal diya gaya hai)
router.post("/", addExpense); 

// 📄 Get Expenses
router.get("/", getExpenses);

export default router;