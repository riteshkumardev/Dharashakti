import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue, push, set } from "firebase/database";
import { app } from "../../../redux/api/firebase/firebase";
import './ExpenseManager.css';

// 👈 role prop add kiya gaya hai
const ExpenseManager = ({ role }) => {
  const db = getDatabase(app);
  
  // 🔐 Permission Check: Sirf Admin aur Accountant hi kharcha add kar sakte hain
  const isAuthorized = role === "Admin" || role === "Accountant";

  const [allExpenses, setAllExpenses] = useState([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [showHistory, setShowHistory] = useState(false); 

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

    // 🛑 Security Guard
    if (!isAuthorized) {
      alert("Unauthorized: Aapko expense add karne ki permission nahi hai.");
      return;
    }

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
      <div className="expense-top-section">
        <div className="table-header-row">
          <h2 className="table-title">COMPANY EXPENSES</h2>
          <div className="grand-total-badge">
             <small>Grand Total</small>
             <span>₹{grandTotal}</span>
          </div>
        </div>

        {/* 🔐 Form protected by role */}
        <div className={`expense-form-card ${!isAuthorized ? 'form-locked' : ''}`}>
          {!isAuthorized && (
            <p style={{ color: '#d32f2f', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>
              🔒 Read Only Mode: Sirf Admin entries kar sakte hain.
            </p>
          )}
          <form onSubmit={handleSubmit} className="expense-compact-form">
            <div className="form-row">
              <div className="input-group">
                <label>Date</label>
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)} 
                  disabled={!isAuthorized}
                />
              </div>
              <div className="input-group">
                <label>Category</label>
                <select 
                  value={formData.category} 
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  disabled={!isAuthorized}
                >
                  <option value="Khana-Pina">Khana-Pina</option>
                  <option value="Dawai">Dawai</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Others">Others</option>
                </select>
              </div>
              <div className="input-group">
                <label>Amount (₹)</label>
                <input 
                  type="number" 
                  value={formData.amount} 
                  onChange={e => setFormData({...formData, amount: e.target.value})} 
                  placeholder="0" 
                  required 
                  disabled={!isAuthorized}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="input-group full-width">
                <label>Details</label>
                <input 
                  type="text" 
                  value={formData.detail} 
                  onChange={e => setFormData({...formData, detail: e.target.value})} 
                  placeholder={isAuthorized ? "Ex: Staff Lunch, Petrol..." : "🔒 Access Restricted"} 
                  disabled={!isAuthorized}
                />
              </div>
              <button 
                type="submit" 
                className="save-expense-btn"
                disabled={!isAuthorized}
                style={{ 
                  opacity: isAuthorized ? 1 : 0.6,
                  cursor: isAuthorized ? 'pointer' : 'not-allowed'
                }}
              >
                {isAuthorized ? "SAVE EXPENSE" : "🔒 LOCKED"}
              </button>
            </div>
          </form>
        </div>

        <button className="toggle-history-btn" onClick={() => setShowHistory(!showHistory)}>
          {showHistory ? "⬆ Hide History" : "⬇ Show History List"}
        </button>
      </div>

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