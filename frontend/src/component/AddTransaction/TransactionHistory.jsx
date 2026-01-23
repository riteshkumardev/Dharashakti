import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './LedgerStyles.css'; // 👈 CSS Import zaroori hai

const TransactionHistory = () => {
  const [parties, setParties] = useState([]);
  const [selectedParty, setSelectedParty] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

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
        console.error("Error fetching parties:", err); 
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
      setHistory(res.data);
    } catch (err) { 
      console.error("Error fetching history:", err); 
    }
  };

  return (
    <div className="ledger-wrapper">
      <div className="ledger-card">
        <h2 className="ledger-header">📖 Party Ledger (Statement)</h2>
        
        <div className="ledger-select-group">
          <label>Select Party:</label>
          <select 
            className="custom-select"
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
          {loading && <span className="loading-pulse">Loading list...</span>}
        </div>
      </div>

      {selectedParty ? (
        <div className="table-container">
          <div className="table-top-bar">
             <span style={{fontWeight: 'bold'}}>Transaction Details</span>
             <span style={{fontSize: '13px', background: '#2563eb', padding: '4px 10px', borderRadius: '4px'}}>
                Total: {history.length}
             </span>
          </div>
          
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Remark/Description</th>
                <th>Type</th>
                <th>Amount</th>
                <th style={{textAlign: 'right'}}>Running Balance</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? history.map((item) => (
                <tr key={item._id}>
                  <td>{new Date(item.date).toLocaleDateString('en-IN')}</td>
                  <td>{item.description || "N/A"}</td>
                  <td>
                    <span className={`badge ${item.type === 'IN' ? 'badge-in' : 'badge-out'}`}>
                      {item.type === 'IN' ? 'RECEIVED' : 'PAID'}
                    </span>
                  </td>
                  <td style={{fontWeight: 'bold', color: item.type === 'IN' ? '#16a34a' : '#dc2626'}}>
                    ₹{item.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="balance-cell">
                    ₹{item.remainingBalance.toLocaleString('en-IN')}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="5" style={{textAlign:'center', padding: '40px', color: '#94a3b8'}}>No history found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
           <p>Hisab dekhne ke liye upar se Party select karein.</p>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;