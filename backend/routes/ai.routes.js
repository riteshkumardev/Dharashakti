import express from "express";
import { getAIAdvice } from "../controllers/ai.controller.js";

const router = express.Router();

router.post("/advice", getAIAdvice);

export default router;
