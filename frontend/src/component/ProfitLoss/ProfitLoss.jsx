import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Loader from "../Core_Component/Loader/Loader";

import "./ProfitLoss.css";
import FinancialSummary from "../Core_Component/Alert/FinancialSummary";

/* =========================
    🔒 Helper (NaN Safe)
   ========================= */
const safeNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const ProfitLoss = () => {
  const [salesList, setSalesList] = useState([]);
  const [purchaseList, setPurchaseList] = useState([]);
  const [employeeList, setEmployeeList] = useState([]); // ✨ Employee list के लिए नया स्टेट
  const [expenses, setExpenses] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  /* =========================
      📡 Fetch ALL Required Data
     ========================= */
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);

        // analytics/profit-loss के साथ-साथ employees लिस्ट मंगाई गई
        const [salesRes, purchaseRes, analyticsRes, empRes] = await Promise.all([
          axios.get(`${API_URL}/api/sales`),
          axios.get(`${API_URL}/api/purchases`),
          axios.get(`${API_URL}/api/analytics/profit-loss`),
          axios.get(`${API_URL}/api/employees`) 
        ]);

        if (salesRes.data?.success) setSalesList(salesRes.data.data || []);
        if (purchaseRes.data?.success) setPurchaseList(purchaseRes.data.data || []);
        if (empRes.data?.success) setEmployeeList(empRes.data.data || []);
        
        if (analyticsRes.data?.success) {
          setExpenses(safeNum(analyticsRes.data.totalExpenses));
        }

      } catch (err) {
        console.error("P&L fetch error:", err);
        setError("Data load karne mein samasya aa rahi hai.");
      } finally {
        setTimeout(() => setLoading(false), 500);
      }
    };

    fetchAll();
  }, [API_URL]);

  /* =========================
      🧮 CALCULATIONS
     ========================= */
  
  // 1. Employee List से कुल सैलरी निकालना
  const totalSalary = useMemo(() => {
    return employeeList.reduce((sum, emp) => sum + safeNum(emp.salary), 0);
  }, [employeeList]);

  const totalSales = useMemo(() => {
    return salesList.reduce((sum, s) => sum + safeNum(s.totalAmount ?? s.totalPrice ?? 0), 0);
  }, [salesList]);

  const totalPurchases = useMemo(() => {
    return purchaseList.reduce((sum, p) => sum + safeNum(p.totalAmount), 0);
  }, [purchaseList]);

  // कुल खर्च = खरीद + अन्य खर्चे + कर्मचारियों की कुल सैलरी
  const totalOut = useMemo(() => totalPurchases + expenses + totalSalary, [totalPurchases, expenses, totalSalary]);
  const netProfit = useMemo(() => totalSales - totalOut, [totalSales, totalOut]);

  if (loading) return <Loader />;

  return (
    <div className="pl-container">
      <div className="pl-header">
        <h3>📊 Profit & Loss Statement (Live)</h3>
        {error && <p style={{ color: "red", fontSize: "12px" }}>{error}</p>}
      </div>

      <div className="pl-table-wrapper card-shadow" style={{ marginTop: "30px" }}>
        <h4 style={{ padding: "15px", margin: 0, borderBottom: "1px solid #eee" }}>Detailed Breakdown</h4>
        <table className="pl-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Category</th>
              <th className="text-right">Amount (₹)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {/* INCOME */}
            <tr>
              <td>Total Sales (All Invoices)</td>
              <td><span className="badge inc">Income</span></td>
              <td className="text-right amount-plus">
                + {totalSales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </td>
              <td>📄 Auto Calculated</td>
            </tr>

            {/* PURCHASES */}
            <tr>
              <td>Total Purchases</td>
              <td><span className="badge pur">Purchase</span></td>
              <td className="text-right amount-minus">
                - {totalPurchases.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </td>
              <td>📦 Stock In</td>
            </tr>

            {/* ✨ STAFF SALARY (Fetched from Employee List) ✨ */}
            <tr>
              <td>Total Employee Salary (Base)</td>
              <td><span className="badge exp" style={{background: "#6f42c1"}}>Payroll</span></td>
              <td className="text-right amount-minus">
                - {totalSalary.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </td>
              <td>👥 {employeeList.length} Employees</td>
            </tr>

            {/* EXPENSES */}
            <tr>
              <td>Other Business Expenses</td>
              <td><span className="badge exp">Expense</span></td>
              <td className="text-right amount-minus">
                - {expenses.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </td>
              <td>💸 Paid</td>
            </tr>

            {/* NET RESULT */}
            <tr className="final-row">
              <td colSpan="2">
                <strong>NET PROFIT / LOSS</strong>
                <p style={{ fontSize: "10px", margin: 0, color: "#666" }}>
                  Formula: Sales − (Purchases + Salary + Expenses)
                </p>
              </td>
              <td className={`text-right total-final ${netProfit >= 0 ? "pos" : "neg"}`}>
                ₹{netProfit.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </td>
              <td>
                <strong className={netProfit >= 0 ? "text-pos" : "text-neg"}>
                  {netProfit >= 0 ? "🚀 PROFIT" : "⚠️ LOSS"}
                </strong>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <FinancialSummary 
        salesList={salesList} 
        purchaseList={purchaseList} 
        expenses={expenses + totalSalary} // Summary में भी सैलरी खर्च को जोड़ा गया
      />
    </div>
  );
};

export default ProfitLoss;