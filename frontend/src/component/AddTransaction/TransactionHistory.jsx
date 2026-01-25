import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './LedgerStyles.css';

const TransactionHistory = () => {
  const [parties, setParties] = useState([]);
  const [selectedParty, setSelectedParty] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState({ totalIn: 0, totalOut: 0, balance: 0 });

  // ✅ Fix: Base URL for Local and Deployed environments
  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  // 1. Fetch Parties List on Load
  useEffect(() => {
    const fetchParties = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/api/suppliers/list`); 
        if (res.data && res.data.success) {
          setParties(res.data.data);
        }
      } catch (err) { 
        console.error("Error fetching parties:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchParties();
  }, [API_BASE_URL]);

  // 2. Fetch History and Calculate Summary
  const fetchHistory = async (partyId) => {
    if (!partyId) {
      setHistory([]);
      setSummary({ totalIn: 0, totalOut: 0, balance: 0 });
      return;
    }
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/api/transactions/history/${partyId}`);
      
      // Data format check: Support both direct array or nested data
      const rawData = Array.isArray(res.data) ? res.data : (res.data.data || []);
      
      // ✅ Sort by Date (Newest first)
      const sortedData = rawData.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // ✅ Summary Calculation
      const totals = rawData.reduce((acc, curr) => {
        if (curr.type === 'IN') acc.in += curr.amount;
        else acc.out += curr.amount;
        return acc;
      }, { in: 0, out: 0 });

      setHistory(sortedData);
      setSummary({ 
        totalIn: totals.in, 
        totalOut: totals.out, 
        balance: rawData[0]?.remainingBalance || 0 
      });
    } catch (err) { 
      console.error("History fetch error:", err); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ledger-wrapper p-4">
      {/* Header & Selection Card */}
      <div className="ledger-card shadow-xl rounded-2xl bg-white p-6 border border-blue-50">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <span className="bg-blue-600 p-2 rounded-lg text-white text-lg">📖</span> 
            Party Ledger Statement
          </h2>
          
          <div className="w-full md:w-1/2">
            <select 
              className="w-full border-2 border-blue-100 rounded-xl p-3 focus:border-blue-500 outline-none transition-all font-bold text-gray-700 bg-gray-50"
              value={selectedParty}
              onChange={(e) => {
                setSelectedParty(e.target.value);
                fetchHistory(e.target.value);
              }}
            >
              <option value="">-- Search Party / Supplier --</option>
              {parties && parties.map(p => (
                <option key={p._id} value={p._id}>{p.name} ({p.phone || 'No Mobile'})</option>
              ))}
            </select>
          </div>
        </div>

        {/* ✅ Summary Ribbon */}
        {selectedParty && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-green-50 p-4 rounded-xl border border-green-100">
              <p className="text-xs text-green-600 font-bold uppercase">Total Received (IN)</p>
              <p className="text-xl font-black text-green-700">₹{summary.totalIn.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-xl border border-red-100">
              <p className="text-xs text-red-600 font-bold uppercase">Total Bill/Paid (OUT)</p>
              <p className="text-xl font-black text-red-700">₹{summary.totalOut.toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-blue-600 p-4 rounded-xl shadow-lg shadow-blue-100">
              <p className="text-xs text-blue-100 font-bold uppercase">Closing Balance</p>
              <p className="text-xl font-black text-white">₹{summary.balance.toLocaleString('en-IN')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Transactions Table */}
      {selectedParty ? (
        <div className="table-container mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-20 text-center text-blue-600 font-bold animate-pulse">
              🔄 Fetching Transaction History...
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="p-4 font-bold text-gray-600 text-xs uppercase tracking-wider">Date</th>
                  <th className="p-4 font-bold text-gray-600 text-xs uppercase tracking-wider">Description</th>
                  <th className="p-4 font-bold text-gray-600 text-xs uppercase tracking-wider">Type</th>
                  <th className="p-4 font-bold text-gray-600 text-xs uppercase tracking-wider">Amount</th>
                  <th className="p-4 font-bold text-gray-600 text-xs uppercase tracking-wider text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {history.length > 0 ? history.map((item) => (
                  <tr key={item._id} className="hover:bg-blue-50/20 transition-colors group">
                    <td className="p-4 text-sm font-semibold text-gray-700">
                      {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-4 text-sm text-gray-500 italic max-w-xs truncate">
                      {item.description || "Business Transaction"}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-tighter ${
                        item.type === 'IN' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {item.type === 'IN' ? 'CREDIT / IN' : 'DEBIT / OUT'}
                      </span>
                    </td>
                    <td className={`p-4 font-bold ${item.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{item.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-gray-800">
                      ₹{item.remainingBalance.toLocaleString('en-IN')}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" className="p-20 text-center text-gray-400">Is party ka koi bhi purana hisab nahi mila.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-20 mt-10 border-2 border-dashed border-gray-200 rounded-3xl opacity-60">
            <span className="text-6xl mb-4">📂</span>
            <p className="text-xl font-bold text-gray-500 italic">Please select a party to view ledger history.</p>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;