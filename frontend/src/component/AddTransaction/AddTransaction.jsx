import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './AddTransaction.css';

const AddTransaction = ({ onTransactionAdded }) => {
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    partyId: '',
    amount: '',
    description: '',
    linkTo: 'sale' // Default sale rakha hai
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const fetchParties = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/suppliers/list`); 
      if (res.data?.success) {
        setParties(res.data.data);
      }
    } catch (err) {
      console.error("Suppliers load error:", err);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchParties();
  }, [fetchParties]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amt = Number(formData.amount);
    if (!formData.partyId || amt <= 0) return alert("Sahi Party aur Amount bharein");

    // Fix Logic: Sale hai toh IN, Purchase hai toh OUT
    const transactionType = formData.linkTo === 'sale' ? 'IN' : 'OUT';

    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/api/transactions/add-with-sync`, {
        ...formData,
        type: transactionType,
        amount: amt
      });

      if (response.data.success) {
        alert(`✅ Success! ${formData.linkTo.toUpperCase()} Updated.`);
        // Form Reset
        setFormData({ partyId: '', amount: '', description: '', linkTo: 'sale' });
        
        // 🔄 Refresh Data: Dono fetch call trigger honge
        fetchParties(); 
        if (onTransactionAdded) onTransactionAdded();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Sync failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="neo-wrapper">
      <div className="neo-card">
        <div className="neo-header">
          <span className="neo-icon">💎</span>
          <h2>3D Smart Sync</h2>
        </div>

        <form onSubmit={handleSubmit} className="neo-form">
          <div className="neo-input-group">
            <label>Choose Party</label>
            <select 
              name="partyId"
              className="neo-select"
              value={formData.partyId}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Party</option>
              {parties.map(p => (
                <option key={p._id} value={p._id}>
                  {p.name} (Bal: ₹{p.totalOwed || 0})
                </option>
              ))}
            </select>
          </div>

          <div className="neo-input-group">
            <label>Transaction Category</label>
            <div className="neo-radio-group">
              <label className={`neo-radio ${formData.linkTo === 'sale' ? 'active-sale' : ''}`}>
                <input 
                  type="radio" 
                  name="linkTo" 
                  value="sale" 
                  checked={formData.linkTo === 'sale'} 
                  onChange={handleInputChange} 
                />
                Sales (Money In)
              </label>
              <label className={`neo-radio ${formData.linkTo === 'purchase' ? 'active-pur' : ''}`}>
                <input 
                  type="radio" 
                  name="linkTo" 
                  value="purchase" 
                  checked={formData.linkTo === 'purchase'} 
                  onChange={handleInputChange} 
                />
                Purchase (Money Out)
              </label>
            </div>
          </div>

          <div className="neo-input-group">
            <label>Amount (₹)</label>
            <input 
              name="amount"
              type="number" 
              className="neo-input"
              placeholder="Enter Amount"
              value={formData.amount}
              onChange={handleInputChange}
              required 
            />
          </div>

          <button 
            type="submit" 
            className={`neo-submit ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? 'SYNCING...' : 'CONFIRM TRANSACTION'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTransaction;