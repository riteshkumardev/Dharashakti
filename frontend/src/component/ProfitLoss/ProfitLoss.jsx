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

        const [salesRes, purchaseRes, analyticsRes] = await Promise.all([
          axios.get(`${API_URL}/api/sales`),
          axios.get(`${API_URL}/api/purchases`),
          axios.get(`${API_URL}/api/analytics/profit-loss`) 
        ]);

        if (salesRes.data?.success) setSalesList(salesRes.data.data || []);
        if (purchaseRes.data?.success) setPurchaseList(purchaseRes.data.data || []);
        if (analyticsRes.data?.success) {
          setExpenses(safeNum(analyticsRes.data.totalExpenses));
        }

      } catch (err) {
        console.error("P&L fetch error:", err);
        setError("Server se Profit/Loss data load nahi ho pa raha.");
      } finally {
        setTimeout(() => setLoading(false), 500);
      }
    };

    fetchAll();
  }, [API_URL]);

  /* =========================
      🧮 CALCULATIONS (Common for Summary & Table)
     ========================= */
  const totalSales = useMemo(() => {
    return salesList.reduce((sum, s) => sum + safeNum(s.totalAmount ?? s.totalPrice ?? 0), 0);
  }, [salesList]);

  const totalPurchases = useMemo(() => {
    return purchaseList.reduce((sum, p) => sum + safeNum(p.totalAmount), 0);
  }, [purchaseList]);

  const totalOut = useMemo(() => totalPurchases + expenses, [totalPurchases, expenses]);
  const netProfit = useMemo(() => totalSales - totalOut, [totalSales, totalOut]);

  if (loading) return <Loader />;

  return (
    <div className="pl-container">
      <div className="pl-header">
        <h3>📊 Profit & Loss Statement (Live)</h3>
        {error && <p style={{ color: "red", fontSize: "12px" }}>{error}</p>}
      </div>


      {/* Detailed Table Section */}
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
            {/* SALES */}
            <tr>
              <td>Total Sales (All Invoices)</td>
              <td><span className="badge inc">Income</span></td>
              <td className="text-right amount-plus">
                + {totalSales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </td>
              <td>📄 Auto Calculated</td>
            </tr>

            {/* PURCHASE */}
            <tr>
              <td>Total Purchases</td>
              <td><span className="badge pur">Purchase</span></td>
              <td className="text-right amount-minus">
                - {totalPurchases.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </td>
              <td>📦 Stock In</td>
            </tr>

            {/* EXPENSE */}
            <tr>
              <td>Total Expenses</td>
              <td><span className="badge exp">Expense</span></td>
              <td className="text-right amount-minus">
                - {expenses.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </td>
              <td>💸 Paid</td>
            </tr>

            {/* NET */}
            <tr className="final-row">
              <td colSpan="2">
                <strong>NET PROFIT / LOSS</strong>
                <p style={{ fontSize: "10px", margin: 0, color: "#666" }}>
                  Formula: Sales − (Purchases + Expenses)
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
      
      {/* ✨ Financial Summary Core Component ✨ */}
      <FinancialSummary 
        salesList={salesList} 
        purchaseList={purchaseList} 
        expenses={expenses} 
      />
    </div>
  );
};

export default ProfitLoss;