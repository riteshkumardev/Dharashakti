import express from "express";
import { markAttendance, getDailyAttendance, getEmployeeMonthlyReport } from "../controllers/attendance.controller.js";

const router = express.Router();

router.post("/", markAttendance);
router.get("/:date", getDailyAttendance);
router.get("/report/:empId", getEmployeeMonthlyReport);

export default router;