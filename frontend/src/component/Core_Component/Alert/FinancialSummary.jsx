import React, { useMemo } from "react";
import "./Alert.css";

/* Helper to ensure numbers are safe */
const safeNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

// Props ke naam salesList aur purchaseList rakhe hain taaki ProfitLoss se match ho
const FinancialSummary = ({ salesList = [], purchaseList = [], expenses = 0, salaryData = [] }) => {
  
  const stats = useMemo(() => {
    // 1. Total Receivables (Lena Hai)
    const totalToReceive = salesList.reduce((sum, s) => 
      sum + safeNum(s.paymentDue || (safeNum(s.totalAmount) - safeNum(s.amountReceived))), 0);

    // 2. Total Payables (Dena Hai - Includes Purchases, Expenses, and Salary)
    const totalPurchasesDue = purchaseList.reduce((sum, p) => 
      sum + safeNum(p.balanceAmount || (safeNum(p.totalAmount) - safeNum(p.paidAmount))), 0);
    
    const totalSalaryPending = salaryData.reduce((sum, sal) => 
      sum + safeNum(sal.pendingAmount), 0);

    const totalPayable = totalPurchasesDue + safeNum(expenses) + totalSalaryPending;

    return {
      receive: totalToReceive,
      pay: totalPayable,
      net: totalToReceive - totalPayable
    };
  }, [salesList, purchaseList, expenses, salaryData]);

  return (
    <div className="financial-summary-grid">
      <div className="summary-card-3d receive">
        <div className="summary-icon">📥</div>
        <div className="summary-info">
          <p>Total Receivables</p>
          <h3>₹{stats.receive.toLocaleString("en-IN")}</h3>
          <small>Customer Dues</small>
        </div>
      </div>

      <div className="summary-card-3d pay">
        <div className="summary-icon">📤</div>
        <div className="summary-info">
          <p>Total Payables</p>
          <h3>₹{stats.pay.toLocaleString("en-IN")}</h3>
          <small>Suppliers & Expenses</small>
        </div>
      </div>

      <div className="summary-card-3d net">
        <div className="summary-icon">⚖️</div>
        <div className="summary-info">
          <p>Net Pending Balance</p>
          <h3 style={{ color: stats.net >= 0 ? "#2ecc71" : "#e74c3c" }}>
            ₹{stats.net.toLocaleString("en-IN")}
          </h3>
          <small>{stats.net >= 0 ? "Positive Cashflow" : "High Liabilities"}</small>
        </div>
      </div>
    </div>
  );
};

export default FinancialSummary;