import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import EWayBillContainer from "../EWayBill/EWayBillContainer";

const InvoicePage = () => {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const navigate = useNavigate();
  
  const [allSales, setAllSales] = useState([]); 
  const [searchTerm, setSearchTerm] = useState(""); 
  const [showPreview, setShowPreview] = useState(false);
  const [ewayData, setEwayData] = useState(null);

  useEffect(() => {
    const loadSales = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/sales`);
        if (res.data.success) setAllSales(res.data.data);
      } catch (err) {
        console.error("Sales load error", err);
      }
    };
    loadSales();
  }, [API_URL]);

  // ✨ Logic: Search by Customer Name OR Bill Number
  const customerHistory = useMemo(() => {
    if (!searchTerm || searchTerm.length < 1) return [];
    return allSales.filter(s => {
      const nameMatch = s.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
      const billMatch = String(s.billNo).toLowerCase().includes(searchTerm.toLowerCase());
      return nameMatch || billMatch;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [searchTerm, allSales]);

  const handleSelectSale = (sale) => {
    setEwayData(sale); 
    setShowPreview(true);
  };

  // Summary Calculations for Search results
  const totalInvoiced = customerHistory.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
  const totalReceived = customerHistory.reduce((sum, s) => sum + (Number(s.amountReceived) || 0), 0);
  const totalPending = totalInvoiced - totalReceived;

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0, color: "#333" }}>Invoices & Customer Ledger</h2>
        <button 
          onClick={() => navigate("/sales-entry")} 
          style={{ padding: "12px 25px", fontSize: "16px", borderRadius: "8px", cursor: "pointer", backgroundColor: "#2196F3", color: "white", border: "none", fontWeight: "bold" }}
        >
          ➕ New Sale Entry
        </button>
      </div>

      {!showPreview && (
        <>
          {/* --- Search Section --- */}
          <div className="no-print" style={{ background: "#f0f7ff", padding: "20px", borderRadius: "10px", marginBottom: "20px", border: "1px solid #007bff" }}>
            <h4 style={{ margin: "0 0 10px 0", color: "#0056b3" }}>🔍 Search by Customer Name or Bill No</h4>
            <input
              type="text"
              placeholder="Type Customer Name or Bill No (e.g. 101)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "100%", padding: "12px", borderRadius: "5px", border: "1px solid #ccc", fontSize: "16px" }}
            />
          </div>

          {/* --- History Table Section --- */}
          {customerHistory.length > 0 && (
            <div className="no-print" style={{ marginBottom: "40px", animation: "fadeIn 0.5s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "10px" }}>
                <h3 style={{ margin: 0 }}>📊 History for: "{searchTerm}"</h3>
                <div style={{ textAlign: "right", fontSize: "14px" }}>
                  <span style={{ marginRight: "15px" }}>Sales: <b>₹{totalInvoiced.toLocaleString()}</b></span>
                  <span style={{ marginRight: "15px", color: "green" }}>Recv: <b>₹{totalReceived.toLocaleString()}</b></span>
                  <span style={{ color: "red" }}>Due: <b>₹{totalPending.toLocaleString()}</b></span>
                </div>
              </div>
              
              <div style={{ overflowX: "auto", background: "white", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead style={{ background: "#f8f9fa", borderBottom: "2px solid #dee2e6" }}>
                    <tr>
                      <th style={{ padding: "12px" }}>Date</th>
                      <th style={{ padding: "12px" }}>Bill No</th>
                      <th style={{ padding: "12px" }}>Customer</th>
                      <th style={{ padding: "12px" }}>Product</th>
                      <th style={{ padding: "12px" }}>Total Bill</th>
                      <th style={{ padding: "12px" }}>Status</th>
                      <th style={{ padding: "12px" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerHistory.map((s) => (
                      <tr key={s._id} style={{ borderBottom: "1px solid #eee" }}>
                        <td style={{ padding: "12px" }}>{s.date}</td>
                        <td style={{ padding: "12px" }}><b>#{s.billNo}</b></td>
                        <td style={{ padding: "12px" }}>{s.customerName}</td>
                        <td style={{ padding: "12px" }}>{s.productName || (s.goods && s.goods[0]?.product)}</td>
                        <td style={{ padding: "12px" }}>₹{Number(s.totalAmount).toLocaleString()}</td>
                        <td style={{ padding: "12px" }}>
                          {Number(s.totalAmount) - Number(s.amountReceived || 0) <= 0 ? 
                            <span style={{color: 'green', fontSize: '11px', fontWeight: 'bold'}}>Paid</span> : 
                            <span style={{color: 'red', fontSize: '11px', fontWeight: 'bold'}}>Due</span>
                          }
                        </td>
                        <td style={{ padding: "12px" }}>
                          <button 
                            onClick={() => handleSelectSale(s)}
                            style={{ padding: "5px 10px", backgroundColor: "#4CAF50", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                          >
                            View Bill 🖨️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {searchTerm && customerHistory.length === 0 && (
            <p style={{ textAlign: "center", color: "#888", marginTop: "20px" }}>No matching records found.</p>
          )}
        </>
      )}

      {showPreview && ewayData && (
        <>
          <div className="no-print" style={{ display: "flex", justifyContent: "center", gap: "20px", marginBottom: "30px" }}>
            <button onClick={() => setShowPreview(false)} style={{ padding: "12px 25px", backgroundColor: "#607D8B", color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}>
              ⬅️ Back to List
            </button>
            {/* <button onClick={() => window.print()} style={{ padding: "12px 25px", backgroundColor: "#4CAF50", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
              🖨️ Print Now
            </button> */}
          </div>
          <EWayBillContainer data={ewayData} />
        </>
      )}
    </div>
  );
};

export default InvoicePage;