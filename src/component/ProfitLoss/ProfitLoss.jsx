import React, { useState, useEffect } from "react";
import { getDatabase, ref, onValue } from "firebase/database";
import { app } from "../../redux/api/firebase/firebase";
import "./ProfitLoss.css";

const ProfitLoss = () => {
  const db = getDatabase(app);
  const [data, setData] = useState({ sales: 0, purchases: 0, expenses: 0 });

  useEffect(() => {
    // 1. Sales Calculation (Using 'amountReceived' as seen in your console)
    const salesRef = ref(db, "sales");
    onValue(salesRef, (snapshot) => {
      let total = 0;
      if (snapshot.exists()) {
        const val = snapshot.val();
        Object.values(val).forEach(item => {
          // Aapke console ke hisaab se 'amountReceived' field hai
          total += Number(item.amountReceived || item.totalAmount || 0);
        });
      }
      setData(prev => ({ ...prev, sales: total }));
    });

    // 2. Purchases Calculation
    const purchaseRef = ref(db, "purchases");
    onValue(purchaseRef, (snapshot) => {
      let total = 0;
      if (snapshot.exists()) {
        const val = snapshot.val();
        Object.values(val).forEach(item => {
          // Purchases mein bhi agar amountReceived hai ya totalAmount
          total += Number(item.amountReceived || item.totalAmount || item.amount || 0);
        });
      }
      setData(prev => ({ ...prev, purchases: total }));
    });

    // 3. Daily Expenses Calculation
    const expenseRef = ref(db, "dailyExpenses");
    onValue(expenseRef, (snapshot) => {
      let total = 0;
      if (snapshot.exists()) {
        const val = snapshot.val();
        Object.values(val).forEach(item => {
          total += Number(item.amount || item.amountReceived || 0);
        });
      }
      setData(prev => ({ ...prev, expenses: total }));
    });
  }, [db]);

  const totalOut = data.purchases + data.expenses;
  const netProfit = data.sales - totalOut;

  return (
    <div className="pl-container">
      <div className="pl-header">
        <h3>📊 Financial Analytics (Live)</h3>
      </div>

      <div className="pl-table-wrapper">
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
            <tr>
              <td>Total Sales Revenue</td>
              <td><span className="badge inc">Income</span></td>
              <td className="text-right amount-plus">+{data.sales.toLocaleString()}</td>
              <td>✅ Received</td>
            </tr>
            <tr>
              <td>Inventory Purchases</td>
              <td><span className="badge exp">Purchase</span></td>
              <td className="text-right amount-minus">-{data.purchases.toLocaleString()}</td>
              <td>📦 Outgoing</td>
            </tr>
            <tr>
              <td>Daily Operational Expenses</td>
              <td><span className="badge exp">Expense</span></td>
              <td className="text-right amount-minus">-{data.expenses.toLocaleString()}</td>
              <td>💸 Paid</td>
            </tr>
            <tr className="final-row">
              <td colSpan="2"><strong>NET SETTLEMENT (Profit/Loss)</strong></td>
              <td className={`text-right total-final ${netProfit >= 0 ? 'pos' : 'neg'}`}>
                ₹{netProfit.toLocaleString()}
              </td>
              <td><strong>{netProfit >= 0 ? "🚀 PROFIT" : "⚠️ LOSS"}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProfitLoss;