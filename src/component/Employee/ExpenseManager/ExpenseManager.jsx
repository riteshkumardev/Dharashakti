import React, { useState, useEffect } from 'react';
import { getDatabase, ref, push, set, onValue } from "firebase/database";
import { app } from "../../../redux/api/firebase/firebase";
import './ExpenseManager.css';

const ExpenseManager = () => {
  const db = getDatabase(app);
  const [allExpenses, setAllExpenses] = useState([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [showHistory, setShowHistory] = useState(false); // Show/Hide state

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState({ category: 'Khana-Pina', amount: '', detail: '' });

  useEffect(() => {
    const expRef = ref(db, `dailyExpenses`);
    const unsubscribe = onValue(expRef, (snapshot) => {
      const data = snapshot.val();
      let tempAllList = [];
      let total = 0;
      if (data) {
        Object.keys(data).forEach(dateKey => {
          Object.keys(data[dateKey]).forEach(id => {
            const entry = data[dateKey][id];
            total += Number(entry.amount);
            tempAllList.push({ id, displayDate: dateKey, ...entry });
          });
        });
      }
      tempAllList.sort((a, b) => new Date(b.displayDate) - new Date(a.displayDate));
      setAllExpenses(tempAllList);
      setGrandTotal(total);
    });
    return () => unsubscribe();
  }, [db]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!formData.amount) return alert("Please enter amount");
    try {
      const expRef = ref(db, `dailyExpenses/${selectedDate}`);
      await set(push(expRef), { 
        ...formData, 
        time: new Date().toLocaleTimeString(),
        entryTimestamp: Date.now() 
      });
      setFormData({ category: 'Khana-Pina', amount: '', detail: '' });
      alert("✅ Saved!");
    } catch (error) { alert("Error: " + error.message); }
  };

  return (
    <div className="expense-fixed-container">
      {/* 1. Fixed Top Header & Form */}
      <div className="expense-top-section">
        <div className="table-header-row">
          <h2 className="table-title">COMPANY EXPENSES</h2>
          <div className="grand-total-badge">
             <small>Grand Total</small>
             <span>₹{grandTotal}</span>
          </div>
        </div>

        <div className="expense-form-card">
          
          <form onSubmit={handleSubmit} className="expense-compact-form">
            <div className="form-row">
              <div className="input-group">
                <label>Date</label>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Category</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  <option value="Khana-Pina">Khana-Pina</option>
                  <option value="Dawai">Dawai</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Others">Others</option>
                </select>
              </div>
              <div className="input-group">
                <label>Amount (₹)</label>
                <input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="0" required />
              </div>
            </div>
            <div className="form-row">
              <div className="input-group full-width">
                <label>Details</label>
                <input type="text" value={formData.detail} onChange={e => setFormData({...formData, detail: e.target.value})} placeholder="Ex: Staff Lunch, Petrol..." />
              </div>
              <button type="submit" className="save-expense-btn">SAVE EXPENSE</button>
            </div>
          </form>
        </div>

        {/* 2. Toggle Button */}
        <button className="toggle-history-btn" onClick={() => setShowHistory(!showHistory)}>
          {showHistory ? "⬆ Hide History" : "⬇ Show History List"}
        </button>
      </div>

      {/* 3. Scrollable Table History */}
      {showHistory && (
        <div className="expense-history-scroll">
           <table className="modern-sales-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Details</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {allExpenses.map((exp) => (
                  <tr key={exp.id}>
                    <td>{exp.displayDate}</td>
                    <td><span className="unit-badge">{exp.category}</span></td>
                    <td>{exp.detail}</td>
                    <td className="amount-red">₹{exp.amount}</td>
                  </tr>
                ))}
              </tbody>
           </table>
        </div>
      )}
    </div>
  );
};

export default ExpenseManager;