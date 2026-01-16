import express from "express";
import { 
  markAttendance, 
  markBulkAttendance, // 🆕 Naya function import karein
  getDailyAttendance, 
  getEmployeeMonthlyReport 
} from "../controllers/attendance.controller.js";

const router = express.Router();

// 1️⃣ Single Attendance Mark karne ke liye
router.post("/", markAttendance);

// 2️⃣ Bulk/Back-date Attendance Mark karne ke liye (Fixes 404 Error)
router.post("/bulk", markBulkAttendance); // 👈 Ye route hona zaroori hai

// 3️⃣ Particular date ki attendance dekhne ke liye
router.get("/:date", getDailyAttendance);

// 4️⃣ Employee ledger/monthly report ke liye
router.get("/report/:empId", getEmployeeMonthlyReport);

export default router;