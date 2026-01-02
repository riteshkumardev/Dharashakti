import React, { useState, useEffect } from 'react';
import axios from "axios";
import "./Stock.css";
import Loader from '../Core_Component/Loader/Loader';

const StockManagement = ({ role }) => {
  const isAuthorized = role === "Admin" || role === "Accountant";

  const [stocks, setStocks] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});

  // Live Backend URL handle karne ke liye dynamic logic
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  // 1️⃣ Fetch Data from MongoDB
  const fetchStocks = async () => {
    try {
      setLoading(true);
      // Live API call using API_URL
      const res = await axios.get(`${API_URL}/api/stocks`);
      if (res.data.success) {
        setStocks(res.data.data);
      }
    } catch (err) {
      console.error("Stock load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, [API_URL]);

  // 🗑️ Delete Logic (Live MongoDB DELETE)
  const handleDelete = async (id) => {
    if (!isAuthorized) {
      alert("Denied ❌: Aapke paas delete karne ki permission nahi hai.");
      return;
    }

    const isConfirmed = window.confirm("Kya aap sach mein is item ko delete karna chahte hain?");
    if (!isConfirmed) return;

    try {
      setLoading(true);
      const res = await axios.delete(`${API_URL}/api/stocks/${id}`);
      if (res.data.success) {
        fetchStocks(); 
      }
    } catch (err) {
      alert("Error ❌: Delete nahi ho paya.");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (stock) => {
    if (!isAuthorized) {
      alert("Denied ❌: Permission missing.");
      return;
    }
    setEditId(stock._id);
    setEditData({ ...stock });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      // Live MongoDB PUT Request
      const res = await axios.put(`${API_URL}/api/stocks/${editId}`, {
        ...editData,
        updatedDate: new Date().toISOString().split("T")[0]
      });
      if (res.data.success) {
        setEditId(null);
        fetchStocks();
      }
    } catch (err) {
      alert("Error ❌: Update fail ho gaya.");
    } finally {
      setLoading(false);
    }
  };

  const filteredStocks = stocks.filter(s => 
    s.productName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loader />;

  return (
    <div className="table-container-wide">
      <div className="table-card-wide">
        <div className="table-header-row">
          <h2 className="table-title">STOCK INVENTORY (Live)</h2>
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input 
              className="table-search-box" 
              placeholder="Search Product..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>

        <div className="table-responsive-wrapper">
          <table className="modern-sales-table">
            <thead>
              <tr>
                <th>SI No.</th>
                <th>Product Name</th>
                <th>Total Quantity</th>
                <th>Last Updated</th>
                <th>Remarks</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStocks.map((stock, index) => {
                const isLow = stock.totalQuantity < 50;
                const isEditing = editId === stock._id;

                return (
                  <tr key={stock._id} className={isEditing ? "active-edit-row" : isLow ? "low-stock-bg" : ""}>
                    <td>{index + 1}</td>
                    <td>
                      {isEditing ? 
                        <input name="productName" value={editData.productName} onChange={(e) => setEditData({...editData, productName: e.target.value})} className="edit-input-field" /> 
                        : stock.productName
                      }
                    </td>
                    <td className="bold-cell">
                      {isEditing ? 
                        <input type="number" name="totalQuantity" value={editData.totalQuantity} onChange={(e) => setEditData({...editData, totalQuantity: e.target.value})} className="edit-input-field small-input" /> 
                        : stock.totalQuantity
                      }
                    </td>
                    <td>{stock.updatedAt ? new Date(stock.updatedAt).toLocaleDateString() : "N/A"}</td>
                    <td>
                      {isEditing ? 
                        <input name="remarks" value={editData.remarks} onChange={(e) => setEditData({...editData, remarks: e.target.value})} className="edit-input-field" /> 
                        : stock.remarks
                      }
                    </td>
                    <td>
                      <span className={`status-badge-pill ${stock.totalQuantity <= 0 ? 'null-bg' : isLow ? 'warning-bg' : 'success-bg'}`}>
                        {stock.totalQuantity <= 0 ? 'Out of Stock' : isLow ? 'Low Stock' : 'Available'}
                      </span>
                    </td>
                    <td className="action-btns-cell">
                      {isEditing ? (
                        <>
                          <button className="save-btn-ui" onClick={handleSave}>💾</button> 
                          <button className="cancel-btn-ui" onClick={() => setEditId(null)}>✖</button>
                        </>
                      ) : (
                        <>
                          <button 
                            className="row-edit-btn" 
                            onClick={() => startEdit(stock)} 
                            disabled={!isAuthorized}
                            style={{ opacity: isAuthorized ? 1 : 0.5 }}
                          >✏️</button> 
                          <button 
                            className="row-delete-btn" 
                            onClick={() => handleDelete(stock._id)} 
                            disabled={!isAuthorized}
                            style={{ opacity: isAuthorized ? 1 : 0.5 }}
                          >🗑️</button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StockManagement;