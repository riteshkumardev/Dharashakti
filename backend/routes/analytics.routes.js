import express from "express";
import { getProfitLossData } from "../controllers/analytics.controller.js";

const router = express.Router();
router.get("/profit-loss", getProfitLossData);

export default router;