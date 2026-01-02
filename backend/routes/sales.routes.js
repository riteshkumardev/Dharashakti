import express from "express";
import {
  addSale,
  getSales,
  deleteSale,
  updateSale
} from "../controllers/sales.controller.js";

const router = express.Router();

router.post("/", addSale);
router.get("/", getSales);
router.put("/:id", updateSale); // PUT route edit karne ke liye
router.delete("/:id", deleteSale);

export default router;