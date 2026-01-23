import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AddTransaction.css'; // 👈 CSS Import zaroori hai

const AddTransaction = () => {
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    partyId: '',
    type: 'IN', 
    amount: '',
    paymentMethod: 'Cash',
    description: ''
  });

  const API_BASE_URL = "http://localhost:5000"; 

  useEffect(() => {
    const fetchParties = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/api/suppliers/list`); 
        if (res.data && res.data.success) {
          setParties(res.data.data);
        }
      } catch (err) {
        console.error("Suppliers load error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchParties();
  }, [API_BASE_URL]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}/api/transactions/add`, formData);
      alert(`Success! Naya Balance: ₹${response.data.updatedBalance}`);
      setFormData({ partyId: '', type: 'IN', amount: '', paymentMethod: 'Cash', description: '' }); 
    } catch (err) {
      alert(err.response?.data?.message || "Error saving transaction");
    }
  };

  return (
    <div className="ledger-wrapper">
      <div className="ledger-card">
        <h2 className="ledger-header">Add New Payment</h2>
        <form onSubmit={handleSubmit}>
          <div className="ledger-form-grid">
            <div className="ledger-select-group">
              <label>Select Party/Supplier</label>
              <select 
                className="custom-select"
                value={formData.partyId}
                onChange={(e) => setFormData({...formData, partyId: e.target.value})}
                required
              >
                <option value="">-- Choose Party --</option>
                {parties && parties.map(p => (
                  <option key={p._id} value={p._id}>{p.name} (Bal: ₹{p.currentBalance || 0})</option>
                ))}
              </select>
            </div>

            <div className="ledger-select-group">
              <label>Transaction Type</label>
              <select 
                className="custom-select"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              >
                <option value="IN">Payment Received (IN)</option>
                <option value="OUT">Payment Given (OUT)</option>
              </select>
            </div>

            <div className="ledger-select-group">
              <label>Amount (₹)</label>
              <input 
                type="number" 
                className="custom-input"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                required 
              />
            </div>

            <div className="ledger-select-group">
              <label>Remark / Note</label>
              <input 
                type="text" 
                className="custom-input"
                placeholder="e.g. Advance"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
          </div>
          <button type="submit" className="ledger-btn-submit" disabled={!formData.partyId}>
            Save Transaction & Update Balance
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTransaction;