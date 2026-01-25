import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AddTransaction.css';

const AddTransaction = ({ onTransactionAdded }) => {
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    partyId: '',
    type: 'IN', 
    amount: '',
    paymentMethod: 'Cash',
    description: '',
    linkTo: 'none' // ✅ New: konsi table update karni hai
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

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
    if (!formData.partyId || !formData.amount) return alert("Please fill all details");

    try {
      setLoading(true);
      // ✅ Backend call jo Supplier, Ledger, aur Sale/Purchase teeno ko update karega
      const response = await axios.post(`${API_BASE_URL}/api/transactions/add-with-sync`, {
        ...formData,
        amount: Number(formData.amount)
      });

      if (response.data.success) {
        alert(`✅ Success! Party Balance & ${formData.linkTo} records updated.`);
        setFormData({ partyId: '', type: 'IN', amount: '', paymentMethod: 'Cash', description: '', linkTo: 'none' });
        if (onTransactionAdded) onTransactionAdded();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Sync failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ledger-wrapper">
      <div className="ledger-card shadow-2xl border-t-4 border-blue-600 p-6 bg-white rounded-2xl">
        <h2 className="text-xl font-black mb-6 text-gray-800 uppercase tracking-tight flex items-center gap-2">
          <span>💸</span> Smart Payment Sync
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Party Selection */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-400 uppercase">Party Name</label>
              <select 
                className="w-full border-2 border-gray-100 rounded-xl p-3 font-bold text-gray-700 bg-gray-50"
                value={formData.partyId}
                onChange={(e) => setFormData({...formData, partyId: e.target.value})}
                required
              >
                <option value="">-- Select Party --</option>
                {parties.map(p => (
                  <option key={p._id} value={p._id}>{p.name} (Bal: ₹{p.totalOwed || 0})</option>
                ))}
              </select>
            </div>

            {/* ✅ Sync Target Selection */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-blue-500 uppercase">Sync with Table?</label>
              <select 
                className="w-full border-2 border-blue-100 rounded-xl p-3 font-bold text-blue-700 bg-blue-50"
                value={formData.linkTo}
                onChange={(e) => setFormData({...formData, linkTo: e.target.value})}
              >
                <option value="none">Ledger Only (General)</option>
                <option value="sale">Update Sales Balance</option>
                <option value="purchase">Update Purchase Balance</option>
              </select>
            </div>

            {/* Type & Amount */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-400 uppercase">Type</label>
              <select 
                className={`w-full border-2 rounded-xl p-3 font-bold ${formData.type === 'IN' ? 'text-green-600 bg-green-50 border-green-200' : 'text-red-600 bg-red-50 border-red-200'}`}
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              >
                <option value="IN">Received (IN)</option>
                <option value="OUT">Paid (OUT)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-400 uppercase">Amount (₹)</label>
              <input 
                type="number" 
                className="w-full border-2 border-gray-100 rounded-xl p-3 font-black text-lg"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                required 
              />
            </div>
          </div>

          <button 
            type="submit" 
            className={`w-full py-4 rounded-xl font-black text-white transition-all shadow-lg ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
            disabled={loading}
          >
            {loading ? 'SYNCING ALL TABLES...' : 'SAVE & SYNC EVERYWHERE'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTransaction;