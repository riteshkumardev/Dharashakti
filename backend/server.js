import express from "express"; // ✅ Sabse pehle express import karein
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
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
import purchaseRoutes from "./routes/purchase.routes.js";
import supplierRoutes from "./routes/supplier.routes.js";

// Database Connection
dotenv.config();
connectDB();

const app = express(); // ✅ Ab yahan express initialize ho jayega bina error ke

// ✅ 1. Robust CORS Configuration
app.use(cors({
  origin: true, 
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true
}));

app.use(express.json());
app.use("/uploads", express.static("uploads"));

// ✅ 2. API Routes Mapping
app.use("/api/sales", salesRoutes);
app.use("/api/employees", employeesRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/activity-logs", logRoutes);
app.use("/api/attendance", attendanceRoutes);

// Professional Inventory Flow Routes
app.use("/api/purchases", purchaseRoutes); 
app.use("/api/stocks", stockRoutes);      
app.use("/api/suppliers", supplierRoutes); 
app.use("/api/expenses", expenseRoutes);
app.use("/api/salary-payments", salaryRoutes);

// ✅ 3. Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

// ✅ 4. Root Route for Health Check
app.get("/", (req, res) => {
  res.status(200).json({ status: "Daharasakti Backend is Live", timestamp: new Date() });
});

// Port configuration
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running locally on port ${PORT}`);
  });
}

// Vercel ke liye export
export default app;