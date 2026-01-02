import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Firebase ki jagah Axios use karenge
import Loader from '../Core_Component/Loader/Loader';

const PurchaseTable = ({ role }) => {
  // 🔐 Permission Check: Sirf Admin aur Accountant edit/delete kar sakte hain
  const isAuthorized = role === "Admin" || role === "Accountant";

  const [purchaseData, setPurchaseData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Live Backend URL handle karne ke liye
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  // --- Edit States ---
  const [editId, setEditId] = useState(null); 
  const [editData, setEditData] = useState({}); 

  // 1️⃣ Fetch Data from MongoDB
  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/purchases`);
      if (res.data.success) {
        // Data ko reverse karke dikhayenge (Newest first)
        setPurchaseData(res.data.data);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      alert("Error loading purchase records from live server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [API_URL]);

  // ✏️ Edit Start with Guard
  const startEdit = (item) => {
    if (!isAuthorized) {
      alert("Aapko edit karne ki permission nahi hai.");
      return;
    }
    setEditId(item._id); // MongoDB ki unique ID use karein
    setEditData({ ...item });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  // ✅ Save Update with Guard (Live MongoDB PUT)
  const handleSave = async () => {
    if (!isAuthorized) return;
    try {
      setLoading(true);
      const res = await axios.put(`${API_URL}/api/purchases/${editId}`, editData);
      
      if (res.data.success) {
        alert("Update Successful! ✅");
        setEditId(null);
        fetchPurchases(); // Table refresh karein
      }
    } catch (err) {
      alert("Error updating: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ Delete with Guard (Live MongoDB DELETE)
  const handleDelete = async (id) => {
    if (!isAuthorized) {
      alert("Aapko delete karne ki permission nahi hai.");
      return;
    }
    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
        setLoading(true);
        const res = await axios.delete(`${API_URL}/api/purchases/${id}`);
        if (res.data.success) {
          alert("Record Deleted! 🗑️");
          fetchPurchases();
        }
      } catch (err) {
        alert("Delete Failed: " + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredData = purchaseData.filter(item =>
    item.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.remarks?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loader />;

  return (
    <div className="table-container-wide">
      <div className="table-card-wide">
        <div className="table-header-row">
          <h2 className="table-title">PURCHASE RECORDS (LIVE)</h2>
          <input 
            type="text" 
            placeholder="Search Product or Remarks..." 
            className="table-search-box"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="table-responsive-wrapper">
          <table className="modern-sales-table">
            <thead>
              <tr>
                <th>SI</th>
                <th>Date</th>
                <th>Item Name</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => (
                <tr key={item._id} className={editId === item._id ? "active-edit" : ""}>
                  <td>{index + 1}</td>
                  <td>{item.date}</td>
                  
                  <td>
                    {editId === item._id ? 
                      <input name="productName" value={editData.productName} onChange={handleEditChange} className="edit-input-field" /> 
                      : item.productName}
                  </td>
                  <td>
                    {editId === item._id ? 
                      <input type="number" name="quantity" value={editData.quantity} onChange={handleEditChange} className="edit-input-field small-input" /> 
                      : item.quantity}
                  </td>
                  <td>{item.unit}</td>
                  <td>
                    {editId === item._id ? 
                      <input name="remarks" value={editData.remarks} onChange={handleEditChange} className="edit-input-field" /> 
                      : item.remarks}
                  </td>

                  <td className="action-btns-cell">
                    {editId === item._id ? (
                      <>
                        <button className="save-btn-ui" onClick={handleSave}>💾 Save</button>
                        <button className="cancel-btn-ui" onClick={() => setEditId(null)}>✖</button>
                      </>
                    ) : (
                      <>
                        <button 
                          className="row-edit-btn" 
                          onClick={() => startEdit(item)}
                          disabled={!isAuthorized}
                          title={!isAuthorized ? "Permission Required" : "Edit"}
                          style={{ 
                            opacity: isAuthorized ? 1 : 0.5, 
                            cursor: isAuthorized ? "pointer" : "not-allowed" 
                          }}
                        >✏️</button>
                        
                        <button 
                          className="row-delete-btn" 
                          onClick={() => handleDelete(item._id)}
                          disabled={!isAuthorized}
                          title={!isAuthorized ? "Permission Required" : "Delete"}
                          style={{ 
                            opacity: isAuthorized ? 1 : 0.5, 
                            cursor: isAuthorized ? "pointer" : "not-allowed" 
                          }}
                        >🗑️</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredData.length === 0 && (
            <div style={{textAlign: 'center', padding: '20px', color: '#666'}}>
              No records found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PurchaseTable;