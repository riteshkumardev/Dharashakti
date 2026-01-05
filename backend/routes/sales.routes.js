import express from "express";
import {
  addSale,
  getSales,
  deleteSale,
  updateSale,
  getLatestBillNo // 🆕 Naya controller function import karein
} from "../controllers/sales.controller.js";

const router = express.Router();

// ✅ 1. Latest Bill Number fetch karne ka route (Sabse upar rakhein)
// Frontend par: axios.get("/api/sales/latest-bill-no")
router.get("/latest-bill-no", getLatestBillNo);

// ✅ 2. Baaki standard routes
router.post("/", addSale);           // Naya bill save karne ke liye
router.get("/", getSales);            // Sales table (Image_ab30e5) dikhane ke liye
router.put("/:id", updateSale);      // Bill edit karne ke liye
router.delete("/:id", deleteSale);   // Bill delete aur stock wapas badhane ke liye

export default router;