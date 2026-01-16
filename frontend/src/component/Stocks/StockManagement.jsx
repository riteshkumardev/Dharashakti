import React, { useState, useEffect } from 'react';
import axios from "axios";
import "./Stock.css";
import Loader from '../Core_Component/Loader/Loader';
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

const StockManagement = ({ role }) => {
  const isAuthorized = role === "Admin" || role === "Accountant";

  const [stocks, setStocks] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const showMsg = (msg, type = "success") => {
    setSnackbar({ open: true, message: msg, severity: type });
  };

  const fetchStocks = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/stocks`);
      if (res.data.success) {
        setStocks(res.data.data);
      }
    } catch (err) {
      showMsg("Stock load karne mein dikkat hui", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, [API_URL]);

  // ✨ PRODUCTION LOGIC: Corn & Rice Summary
  const getInventorySummary = () => {
    const getQty = (name) => stocks.find(s => s.productName === name)?.totalQuantity || 0;

    // 🌽 Corn logic: Grit + Grit 3mm + Feed + Flour
    const totalCornDerived = getQty("Corn Grit") + getQty("Corn Grit (3mm)") + getQty("Cattle Feed") + getQty("Corn Flour");
    
    // 🌾 Rice logic: Rice Grit + Rice Flour = Rice Broken
    const totalRiceBroken = getQty("Rice Grit") + getQty("Rice Flour");

    // 🛍️ Packing Bag Logic: Convert KG to Pieces (401 KG * 11 = 4411 Pcs)
    const bagWeightKg = getQty("Packing Bag");
    const actualBagsAvailable = Math.floor(bagWeightKg * 11);

    // Estimated pieces required: Total Weight in Stock / 50 KG
    const totalProductionWeight = stocks.reduce((sum, s) => 
      !s.productName.includes("Bag") && !s.productName.includes("Corn") && !s.productName.includes("Rice") 
      ? sum + (Number(s.totalQuantity) || 0) : sum, 0
    );
    const estimatedBagsRequired = Math.ceil(totalProductionWeight / 50);

    return { totalCornDerived, totalRiceBroken, actualBagsAvailable, estimatedBagsRequired };
  };

  const summary = getInventorySummary();

  const handleSave = async () => {
    try {
      setLoading(true);
      const res = await axios.put(`${API_URL}/api/stocks/${editId}`, {
        ...editData,
        updatedDate: new Date().toISOString().split("T")[0]
      });
      if (res.data.success) {
        showMsg("Stock update ho gaya! ✅");
        setEditId(null);
        fetchStocks();
      }
    } catch (err) {
      showMsg("Update fail ho gaya.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!isAuthorized || !window.confirm("Kya aap delete karna chahte hain?")) return;
    try {
      setLoading(true);
      const res = await axios.delete(`${API_URL}/api/stocks/${id}`);
      if (res.data.success) {
        showMsg("Item deleted successfully");
        fetchStocks();
      }
    } catch (err) {
      showMsg("Delete fail ho gaya.", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredStocks = stocks.filter(s => 
    s.productName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loader />;

  return (
    <div className="table-container-wide professional-stock-page">
      
      {/* 📊 Dashboard Summary Cards */}
      <div className="stock-summary-row">
        <div className="summary-card total">
          <span className="card-label">Total Corn Consumed</span>
          <span className="card-value">{summary.totalCornDerived.toLocaleString()} KG</span>
          <small>Grit + Feed + Flour</small>
        </div>
        <div className="summary-card low">
          <span className="card-label">Total Rice Broken</span>
          <span className="card-value">{summary.totalRiceBroken.toLocaleString()} KG</span>
          <small>Rice Grit + Rice Flour</small>
        </div>
        <div className="summary-card out">
          <span className="card-label">Bags Inventory</span>
          <span className="card-value">{summary.actualBagsAvailable.toLocaleString()} Pcs</span>
          <small>Need approx {summary.estimatedBagsRequired} Pcs</small>
        </div>
      </div>

      <div className="table-card-wide modern-stock-card">
        <div className="table-header-row professional-header">
          <div className="title-group">
            <h2 className="table-title">Inventory Control Panel</h2>
            <p className="subtitle">Real-time tracking for Rice Broken & Corn processing</p>
          </div>
          <div className="search-wrapper modern-search">
            <span className="search-icon">🔍</span>
            <input 
              className="table-search-box" 
              placeholder="Search product..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>

        <div className="table-responsive-wrapper">
          <table className="modern-sales-table professional-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product Name</th>
                <th>Inventory Count</th>
                <th>Last Interaction</th>
                <th>Remarks</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStocks.map((stock, index) => {
                const qty = Number(stock.totalQuantity) || 0;
                const isEditing = editId === stock._id;
                const isOut = qty <= 0;
                const isBag = stock.productName.includes("Bag");

                return (
                  <tr key={stock._id} className={`${isEditing ? "active-edit-row" : ""} ${isOut ? "out-stock-row" : ""}`}>
                    <td>{index + 1}</td>
                    <td>
                      {isEditing ? 
                        <input value={editData.productName} onChange={(e) => setEditData({...editData, productName: e.target.value})} className="edit-input-field" /> 
                        : <div className="product-name-bold">{stock.productName}</div>
                      }
                    </td>
                    <td className="bold-cell">
                      {isEditing ? 
                        <input type="number" value={editData.totalQuantity} onChange={(e) => setEditData({...editData, totalQuantity: e.target.value})} className="edit-input-field small-input" /> 
                        : <span className={isOut ? "negative-val" : ""}>
                            {/* ✨ If Packing Bag, show Pcs (KG * 11) else KG */}
                            {isBag ? (qty * 11).toLocaleString() : qty.toLocaleString()} {isBag ? "Pcs" : "KG"}
                          </span>
                      }
                    </td>
                    <td>{stock.updatedAt ? new Date(stock.updatedAt).toLocaleDateString('en-GB') : "N/A"}</td>
                    <td>
                      {isEditing ? 
                        <input value={editData.remarks} onChange={(e) => setEditData({...editData, remarks: e.target.value})} className="edit-input-field" /> 
                        : <span className="remarks-text">{stock.remarks || "-"}</span>
                      }
                    </td>
                    <td>
                      <div className={`status-pill-pro ${isOut ? 'pill-danger' : qty < 500 ? 'pill-warning' : 'pill-success'}`}>
                        <span className="dot"></span>
                        {isOut ? 'Critical Out' : qty < 500 ? 'Low Stock' : 'Healthy'}
                      </div>
                    </td>
                    <td className="action-btns-cell">
                      {isEditing ? (
                        <div className="btn-group-pro">
                          <button className="pro-save-btn" onClick={handleSave}>Save</button> 
                          <button className="pro-cancel-btn" onClick={() => setEditId(null)}>✖</button>
                        </div>
                      ) : (
                        <div className="btn-group-pro">
                          <button className="pro-edit-icon" onClick={() => { setEditId(stock._id); setEditData({...stock}); }} disabled={!isAuthorized}>✏️</button> 
                          <button className="pro-delete-icon" onClick={() => handleDelete(stock._id)} disabled={!isAuthorized}>🗑️</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <CustomSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} />
    </div>
  );
};

export default StockManagement;