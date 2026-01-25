import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './LedgerStyles.css';

const TransactionHistory = () => {
  const [parties, setParties] = useState([]);
  const [selectedParty, setSelectedParty] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ FIX: Environment Variable use karein ya deployed URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  useEffect(() => {
    const fetchParties = async () => {
      try {
        setLoading(true);
        // Backend route match check karein (suppliers/list ya suppliers)
        const res = await axios.get(`${API_BASE_URL}/api/suppliers/list`); 
        if (res.data && res.data.success) {
          setParties(res.data.data);
        }
      } catch (err) { 
        console.error("Fetch error:", err.message);
        // Check karein agar Vercel par block ho raha hai
        if (window.location.protocol === 'https:' && API_BASE_URL.startsWith('http:')) {
            console.error("Blocked: Insecure backend request from secure frontend.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchParties();
  }, [API_BASE_URL]);

  const fetchHistory = async (partyId) => {
    if (!partyId) {
      setHistory([]);
      return;
    }
    try {
      const res = await axios.get(`${API_BASE_URL}/api/transactions/history/${partyId}`);
      // Agar backend direct array bhej raha hai
      setHistory(Array.isArray(res.data) ? res.data : (res.data.data || []));
    } catch (err) { 
      console.error("History fetch error:", err); 
    }
  };

  return (
    <div className="ledger-wrapper">
      <div className="ledger-card shadow-lg">
        <h2 className="ledger-header">📖 Party Ledger (Statement)</h2>
        
        <div className="ledger-select-group">
          <label className="font-bold text-gray-700">Select Party:</label>
          <select 
            className="custom-select border-2 border-blue-100 rounded-xl p-2 focus:border-blue-500 outline-none"
            value={selectedParty}
            onChange={(e) => {
              setSelectedParty(e.target.value);
              fetchHistory(e.target.value);
            }}
          >
            <option value="">-- Search Party/Supplier --</option>
            {parties && parties.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
          {loading && <div className="mt-2 text-blue-500 animate-pulse text-xs font-bold">Connecting to Database...</div>}
        </div>
      </div>

      {selectedParty ? (
        <div className="table-container mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="table-top-bar flex justify-between items-center bg-blue-600 p-4 rounded-t-xl text-white">
             <span className="font-black tracking-wider">TRANSACTION DETAILS</span>
             <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-mono">
                RECORDS: {history.length}
             </span>
          </div>
          
          <table className="ledger-table w-full bg-white">
            <thead>
              <tr className="bg-gray-100 text-gray-600 uppercase text-xs">
                <th className="p-4 text-left">Date</th>
                <th className="p-4 text-left">Remark</th>
                <th className="p-4 text-left">Type</th>
                <th className="p-4 text-left">Amount</th>
                <th className="p-4 text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? history.map((item) => (
                <tr key={item._id} className="border-b hover:bg-blue-50/30 transition-colors">
                  <td className="p-4 text-sm font-medium">{new Date(item.date).toLocaleDateString('en-IN')}</td>
                  <td className="p-4 text-sm text-gray-500">{item.description || "N/A"}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-black ${item.type === 'IN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {item.type === 'IN' ? 'RECEIVED' : 'PAID'}
                    </span>
                  </td>
                  <td className={`p-4 font-bold ${item.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{item.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="p-4 text-right font-mono font-bold text-blue-900">
                    ₹{item.remainingBalance.toLocaleString('en-IN')}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="5" className="p-10 text-center text-gray-400 italic">No transactions found for this party.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state mt-10 p-10 border-2 border-dashed border-gray-200 rounded-3xl text-center">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-gray-500 font-medium">Hisab dekhne ke liye upar se Party select karein.</p>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;