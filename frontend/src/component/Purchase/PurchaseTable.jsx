import React, { useState, useEffect } from 'react';
import axios from "axios";
import './Purchase.css';
import Loader from '../Core_Component/Loader/Loader';
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

const PurchaseTable = ({ role }) => {
  const isAuthorized = role === "Admin" || role === "Accountant";

  const [purchaseData, setPurchaseData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null); 
  const [editData, setEditData] = useState({}); 
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const showMsg = (msg, type = "success") => {
    setSnackbar({ open: true, message: msg, severity: type });
  };

const fetchPurchases = async () => {
  try {
    setLoading(true);

    const res = await axios.get(`${API_URL}/api/purchases`);
    console.log("PURCHASE API RESPONSE 👉", res.data); // 👈 MUST

    if (res.data?.success && Array.isArray(res.data.data)) {
      setPurchaseData(res.data.data);
    } else {
      setPurchaseData([]);
      showMsg("Purchase data empty hai", "warning");
    }

  } catch (err) {
    console.error("FETCH ERROR ❌", err);
    setPurchaseData([]);
    showMsg("Server se data load nahi ho paya", "error");
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchPurchases();
  }, [API_URL]);

  // 2️⃣ Auto Calculation in Edit Mode (Qty * Rate - CD%)
  useEffect(() => {
    if (editId) {
      const qty = Number(editData.quantity) || 0;
      const rate = Number(editData.rate) || 0;
      const cdPercent = Number(editData.cashDiscount) || 0;

      const basePrice = qty * rate;
      const discountAmount = (basePrice * cdPercent) / 100;
      const total = basePrice - discountAmount; 
      
      const balance = total - (Number(editData.paidAmount) || 0);

      setEditData((prev) => ({ 
        ...prev, 
        totalAmount: total, 
        balanceAmount: balance 
      }));
    }
  }, [editData.quantity, editData.rate, editData.cashDiscount, editData.paidAmount, editId]);

  const startEdit = (item) => {
    if (!isAuthorized) {
      showMsg("Aapko permission nahi hai", "warning");
      return;
    }
    setEditId(item._id);
    setEditData({ ...item });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const res = await axios.put(`${API_URL}/api/purchases/${editId}`, editData);
      if (res.data.success) {
        showMsg("Purchase Record Updated! ✅");
        setEditId(null);
        fetchPurchases();
      }
    } catch (err) {
      showMsg("Update fail ho gaya", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!isAuthorized) {
      showMsg("Permission Denied ❌", "error");
      return;
    }
    if (window.confirm("Kya aap delete karna chahte hain?")) {
      try {
        setLoading(true);
        const res = await axios.delete(`${API_URL}/api/purchases/${id}`);
        if (res.data.success) {
          showMsg("Record Deleted! 🗑️");
          fetchPurchases();
        }
      } catch (err) {
        showMsg("Delete fail ho gaya", "error");
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredData = purchaseData.filter(item =>
    item.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.vehicleNo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  if (loading) return <Loader />;

  return (
    <>
      <div className="table-container-wide">
        <div className="table-card-wide">
          <div className="table-header-flex">
            <h2 className="table-title">PURCHASE RECORDS</h2>
            <input 
              className="table-search-input"
              placeholder="Search Supplier, Product or Vehicle..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
          </div>

          <div className="table-responsive-wrapper">
            <table className="modern-sales-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Bill/Vehicle</th>
                  <th>Supplier / Item</th>
                  <th>Qty / Rate</th>
                  <th>CD (%)</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Remarks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.map((item) => (
                  <tr key={item._id} className={editId === item._id ? "active-edit" : ""}>
                    <td>
                      {editId === item._id ? 
                        <input type="date" value={editData.date} onChange={(e) => setEditData({...editData, date: e.target.value})} /> 
                        : item.date}
                    </td>

                    <td>
                      {editId === item._id ? (
                        <>
                          <input placeholder="Bill No" value={editData.billNo} onChange={(e) => setEditData({...editData, billNo: e.target.value})} />
                          <input placeholder="Vehicle No" value={editData.vehicleNo} onChange={(e) => setEditData({...editData, vehicleNo: e.target.value})} />
                        </>
                      ) : (
                        <div style={{fontSize: '0.85rem'}}>
                          <span className="bill-tag">{item.billNo || "No Bill"}</span><br/>
                          <small style={{color: '#666'}}>{item.vehicleNo || "N/A"}</small>
                        </div>
                      )}
                    </td>

                    <td>
                      {editId === item._id ? (
                        <>
                          <input placeholder="Supplier" value={editData.supplierName} onChange={(e) => setEditData({...editData, supplierName: e.target.value})} />
                          <input placeholder="Product" value={editData.productName} onChange={(e) => setEditData({...editData, productName: e.target.value})} />
                        </>
                      ) : (
                        <div>
                          <strong>{item.supplierName}</strong><br/>
                          <small>{item.productName}</small>
                        </div>
                      )}
                    </td>

                    <td>
                      {editId === item._id ? (
                        <>
                          <input type="number" placeholder="Qty" value={editData.quantity} onChange={(e) => setEditData({...editData, quantity: e.target.value})} />
                          <input type="number" placeholder="Rate" value={editData.rate} onChange={(e) => setEditData({...editData, rate: e.target.value})} />
                        </>
                      ) : (
                        <span>{item.quantity} @ ₹{item.rate}</span>
                      )}
                    </td>

                    <td>
                        {editId === item._id ? 
                          <input type="number" value={editData.cashDiscount} onChange={(e) => setEditData({...editData, cashDiscount: e.target.value})} /> 
                          : `${item.cashDiscount || 0}%`}
                    </td>

                    <td style={{fontWeight: 'bold'}}>₹{editId === item._id ? editData.totalAmount : item.totalAmount}</td>

                    <td>
                      {editId === item._id ? 
                        <input type="number" value={editData.paidAmount} onChange={(e) => setEditData({...editData, paidAmount: e.target.value})} /> 
                        : `₹${item.paidAmount}`
                      }
                    </td>

                    <td style={{color: 'red', fontWeight: 'bold'}}>₹{editId === item._id ? editData.balanceAmount : item.totalAmount - item.paidAmount}</td>

                    <td>
                      {editId === item._id ? 
                        <input value={editData.remarks} onChange={(e) => setEditData({...editData, remarks: e.target.value})} /> 
                        : <small>{item.remarks}</small>
                      }
                    </td>

                    <td>
                      {editId === item._id ? (
                        <div className="btn-group-row">
                          <button className="save-btn-ui" onClick={handleSave}>💾</button> 
                          <button className="cancel-btn-ui" onClick={() => setEditId(null)}>✖</button>
                        </div>
                      ) : (
                        <div className="btn-group-row">
                          <button className="row-edit-btn" onClick={() => startEdit(item)} disabled={!isAuthorized}>✏️</button> 
                          <button className="row-delete-btn" onClick={() => handleDelete(item._id)} disabled={!isAuthorized}>🗑️</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination-container">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="pg-btn">◀ Prev</button>
            <span className="pg-info">Page {currentPage} of {totalPages || 1}</span>
            <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="pg-btn">Next ▶</button>
          </div>
        </div>
      </div>

      <CustomSnackbar 
        open={snackbar.open} 
        message={snackbar.message} 
        severity={snackbar.severity} 
        onClose={() => setSnackbar({ ...snackbar, open: false })} 
      />
    </>
  );
};

export default PurchaseTable;