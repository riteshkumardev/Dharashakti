import React, { useState, useEffect } from 'react';
import axios from 'axios'; // 🛠️ Firebase ki jagah Axios
import './ExpenseManager.css';

// 🏗️ Core Components Import
import Loader from "../../Core_Component/Loader/Loader";
import CustomSnackbar from "../../Core_Component/Snackbar/CustomSnackbar";

const ExpenseManager = ({ role }) => {
  // 🔐 Permission Check
  const isAuthorized = role === "Admin" || role === "Accountant";

  const [allExpenses, setAllExpenses] = useState([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [showHistory, setShowHistory] = useState(false); 

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState({ category: 'Khana-Pina', amount: '', detail: '' });

  // ⏳ Feedback States
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const showMsg = (msg, type = "success") => {
    setSnackbar({ open: true, message: msg, severity: type });
  };

  // 1️⃣ Fetch Expenses from MongoDB
  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/expenses");
      if (res.data.success) {
        setAllExpenses(res.data.data);
        setGrandTotal(res.data.totalSum);
      }
    } catch (err) {
      showMsg("Server se data load nahi ho saka", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthorized) {
      showMsg("Unauthorized access!", "error");
      return;
    }

    if(!formData.amount) {
        showMsg("Please enter amount", "warning");
        return;
    }

    setLoading(true);
    try {
      // 🛠️ MongoDB POST Request
      const res = await axios.post("http://localhost:5000/api/expenses", {
        ...formData,
        date: selectedDate
      });

      if (res.data.success) {
        setFormData({ category: 'Khana-Pina', amount: '', detail: '' });
        showMsg("✅ Expense Saved Successfully!", "success");
        fetchExpenses(); // List aur Total refresh karein
      }
    } catch (error) { 
      showMsg("Error: " + error.message, "error"); 
    } finally {
      setLoading(false);
    }
  };

  if (loading && allExpenses.length === 0) return <Loader />;

  return (
    <div className="expense-fixed-container">
      {loading && <Loader />}

      <div className="expense-top-section">
        <div className="table-header-row">
          <h2 className="table-title">COMPANY EXPENSES (MongoDB)</h2>
          <div className="grand-total-badge">
             <small>Grand Total</small>
             <span>₹{grandTotal}</span>
          </div>
        </div>

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
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} disabled={!isAuthorized || loading} />
              </div>
              <div className="input-group">
                <label>Category</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} disabled={!isAuthorized || loading} >
                  <option value="Khana-Pina">Khana-Pina</option>
                  <option value="Dawai">Dawai</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Others">Others</option>
                </select>
              </div>
              <div className="input-group">
                <label>Amount (₹)</label>
                <input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="0" required disabled={!isAuthorized || loading} />
              </div>
            </div>
            <div className="form-row">
              <div className="input-group full-width">
                <label>Details</label>
                <input type="text" value={formData.detail} onChange={e => setFormData({...formData, detail: e.target.value})} placeholder={isAuthorized ? "Ex: Staff Lunch, Petrol..." : "🔒 Access Restricted"} disabled={!isAuthorized || loading} />
              </div>
              <button type="submit" className="save-expense-btn" disabled={!isAuthorized || loading} style={{ opacity: isAuthorized ? 1 : 0.6 }}>
                {loading ? "SAVING..." : (isAuthorized ? "SAVE EXPENSE" : "🔒 LOCKED")}
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
                 <tr key={exp._id}>
                   <td>{exp.date}</td>
                   <td><span className="unit-badge">{exp.category}</span></td>
                   <td>{exp.detail}</td>
                   <td className="amount-red">₹{exp.amount}</td>
                 </tr>
               ))}
               {allExpenses.length === 0 && (
                 <tr><td colSpan="4" style={{textAlign:'center', padding:'20px'}}>No expenses found.</td></tr>
               )}
             </tbody>
           </table>
        </div>
      )}

      <CustomSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} />
    </div>
  );
};

export default ExpenseManager;