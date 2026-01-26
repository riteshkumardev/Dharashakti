import express from "express"; 
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
import aiRoutes from "./routes/ai.routes.js";
import backupRoutes from "./routes/backup.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";



// Initialize Config
dotenv.config();
connectDB();

const app = express();

// ✅ 1. Optimized CORS Configuration
// Production mein 'true' ki jagah specific frontend URL daalna better hai
app.use(cors({
  origin: process.env.FRONTEND_URL || true, 
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true
}));

// ✅ 2. Payload Limit (Zaroori for large backups)
app.use(express.json({ limit: "50mb" })); 
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ✅ 3. Static Files Middleware
const __dirname = path.resolve();
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ 4. API Routes Mapping
app.use("/api/auth", authRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/employees", employeesRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/activity-logs", logRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/purchases", purchaseRoutes); 
app.use("/api/stocks", stockRoutes);      
app.use("/api/suppliers", supplierRoutes); 
app.use("/api/expenses", expenseRoutes);
app.use("/api/salary-payments", salaryRoutes);
app.use("/api/backup", backupRoutes); 
app.use('/api/transactions', transactionRoutes);

// ✅ 5. Root Route (Health Check)
app.get("/", (req, res) => {
  res.status(200).json({ 
    status: "Daharasakti Backend is Live ✅", 
    timestamp: new Date().toLocaleString() 
  });
});

// ✅ 6. 404 Handler (Agar koi route na mile)
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ✅ 7. Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.status || 500;
  console.error(`[${new Date().toISOString()}] Error: ${err.stack}`);
  res.status(statusCode).json({ 
    success: false, 
    message: err.message || "Internal Server Error" 
  });
});

// Port configuration
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running locally on port ${PORT}`);
  });
}

export default app;