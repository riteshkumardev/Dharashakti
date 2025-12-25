import React, { useState, useEffect } from 'react';
import './Emp.css';
// 1. Firebase imports
import { getDatabase, ref, onValue, set, update } from "firebase/database";
import { app } from "../../redux/api/firebase/firebase";

const EmployeeDetails = ({ employee, onBack }) => {
  const db = getDatabase(app);
  
  const [ledger, setLedger] = useState({
    workingDays: 0,
    dailyWage: 0,
    totalWages: 0,
    paymentMade: 0,
    remaining: 0
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 2. Firebase se is employee ka ledger fetch karna
  useEffect(() => {
    if (!employee?.firebaseId) return;

    const ledgerRef = ref(db, `ledgers/${employee.firebaseId}`);
    
    const unsubscribe = onValue(ledgerRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setLedger(data);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [employee, db]);

  // 3. Calculation logic
  useEffect(() => {
    const total = (Number(ledger.workingDays) || 0) * (Number(ledger.dailyWage) || 0);
    const remain = total - (Number(ledger.paymentMade) || 0);
    
    // Sirf tabhi update karein jab values badli hon
    if (total !== ledger.totalWages || remain !== ledger.remaining) {
        setLedger(prev => ({ ...prev, totalWages: total, remaining: remain }));
    }
  }, [ledger.workingDays, ledger.dailyWage, ledger.paymentMade]);

  // 4. Ledger ko Firebase mein Save karne ka function
  const handleSaveLedger = async () => {
    setSaving(true);
    try {
      await set(ref(db, `ledgers/${employee.firebaseId}`), ledger);
      alert(`🎉 Ledger for ${employee.name} saved successfully!`);
    } catch (err) {
      alert("Error saving ledger: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!employee) {
    return (
      <div className="ledger-card">
        <p>No employee selected. Please go back.</p>
        <button onClick={onBack}>← Back to List</button>
      </div>
    );
  }

  if (loading) return <div className="no-records-box">Loading Ledger Data...</div>;

  return (
    <div className="ledger-card">
        <div className="ledger-header">
            <button className="btn-back" onClick={onBack}>← Back</button>
            <button 
                className="btn-submit-colored" 
                onClick={handleSaveLedger} 
                disabled={saving}
            >
                {saving ? "Saving..." : "💾 Save Ledger"}
            </button>
        </div>

        <h2>Payroll Ledger: {employee.name}</h2> 
        <p className="emp-sub-info">Aadhar: {employee.aadhar} | Phone: {employee.phone}</p>
        
        <div className="ledger-grid">
            <div className="stat-box">
                <label>Working Days</label>
                <input 
                    type="number" 
                    value={ledger.workingDays} 
                    onChange={e => setLedger({...ledger, workingDays: e.target.value})} 
                />
            </div>
            <div className="stat-box">
                <label>Daily Wage</label>
                <input 
                    type="number" 
                    value={ledger.dailyWage} 
                    onChange={e => setLedger({...ledger, dailyWage: e.target.value})} 
                />
            </div>
            <div className="stat-box highlight">
                <label>Total Wages</label>
                <p>₹{ledger.totalWages}</p>
            </div>
            <div className="stat-box">
                <label>Payment Made</label>
                <input 
                    type="number" 
                    value={ledger.paymentMade} 
                    onChange={e => setLedger({...ledger, paymentMade: e.target.value})} 
                />
            </div>
            <div className={`stat-box ${ledger.remaining > 0 ? 'danger' : 'success'}`}>
                <label>Remaining Balance</label>
                <p>₹{ledger.remaining}</p>
            </div>
        </div>
    </div>
  );
};

export default EmployeeDetails;