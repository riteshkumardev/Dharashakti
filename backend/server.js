import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path"; // Path module import karein
import connectDB from "./config/db.js";

// Routes Imports
import salesRoutes from "./routes/sales.routes.js";
import employeesRoutes from "./routes/employees.routes.js";
import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import logRoutes from "./routes/log.routes.js";
import salaryRoutes from "./routes/salary.routes.js";
import stockRoutes from "./routes/stock.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import expenseRoutes from "./routes/expense.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";

dotenv.config();
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads")); // Static folder for photos

// API Routes Registration
app.use("/api/sales", salesRoutes);
app.use("/api/employees", employeesRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/activity-logs", logRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/purchases", stockRoutes); 
app.use("/api/stocks", stockRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/salary-payments", salaryRoutes);

app.get("/", (req, res) => {
  res.send("Backend running successfully");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;