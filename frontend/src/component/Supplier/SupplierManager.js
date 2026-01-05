import React, { useState, useEffect } from "react";
import axios from "axios";
import "./SupplierManager.css";
import Loader from '../Core_Component/Loader/Loader';
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

const SupplierManager = () => {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); // ✨ New Search State
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    gstin: "",
    previousBalance: 0,
    lastBillNo: "",
    lastBillDate: ""
  });

  const [editId, setEditId] = useState(null);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/api/suppliers/list");
      if (response.data.success) {
        setSuppliers(response.data.data);
      }
    } catch (error) {
      showMsg("Error fetching suppliers", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const showMsg = (msg, sev) => {
    setSnackbar({ open: true, message: msg, severity: sev });
  };

  // ✨ Search Logic: Name, GSTIN, ya Phone mein se filter karega
  const filteredSuppliers = suppliers.filter((s) => {
    const search = searchTerm.toLowerCase();
    return (
      s.name.toLowerCase().includes(search) ||
      (s.gstin && s.gstin.toLowerCase().includes(search)) ||
      (s.phone && s.phone.includes(search))
    );
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) {
        const response = await axios.put(`http://localhost:5000/api/suppliers/update/${editId}`, formData);
        if (response.data.success) showMsg("Supplier updated successfully!", "success");
      } else {
        const response = await axios.post("http://localhost:5000/api/suppliers/add", formData);
        showMsg("Supplier saved successfully!", "success");
      }
      resetForm();
      fetchSuppliers();
    } catch (error) {
      showMsg(error.response?.data?.message || "Operation failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure?")) {
      setLoading(true);
      try {
        await axios.delete(`http://localhost:5000/api/suppliers/delete/${id}`);
        setSuppliers(suppliers.filter(s => s._id !== id));
        showMsg("Deleted", "info");
      } catch (error) {
        showMsg("Delete failed", "error");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = (s) => {
    setEditId(s._id);
    setFormData({
      name: s.name,
      address: s.address,
      phone: s.phone,
      gstin: s.gstin,
      previousBalance: s.previousBalance,
      lastBillNo: s.lastBillNo || "",
      lastBillDate: s.lastBillDate ? s.lastBillDate.substring(0, 10) : ""
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ name: "", address: "", phone: "", gstin: "", previousBalance: 0, lastBillNo: "", lastBillDate: "" });
    setEditId(null);
    setShowForm(false);
  };

  if (loading && !suppliers.length) return <Loader />;

  return (
    <div className="supplier-container">
      <div className="supplier-header">
        <div className="header-left">
           <h2>🚚 Supplier Management</h2>
        </div>
        
        <div className="header-right" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          {/* ✨ Professional Search Bar */}
          {!showForm && (
            <div className="search-wrapper">
              <input 
                type="text" 
                placeholder="🔍 Search name, GSTIN, mobile..." 
                className="search-field"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}
          
          <button className="toggle-btn" onClick={() => (showForm ? resetForm() : setShowForm(true))}>
            {showForm ? "📁 View List" : "➕ Add New Supplier"}
          </button>
        </div>
      </div>

      {showForm ? (
        <form className="supplier-form" onSubmit={handleSubmit}>
          <h3>{editId ? "📝 Edit Supplier" : "🆕 Add New Supplier"}</h3>
          <div className="form-grid">
            <input placeholder="Supplier Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            <input placeholder="GSTIN" value={formData.gstin} onChange={e => setFormData({...formData, gstin: e.target.value})} />
            <input placeholder="Mobile Number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            <input placeholder="Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
            <input placeholder="Bill No." value={formData.lastBillNo} onChange={e => setFormData({...formData, lastBillNo: e.target.value})} />
            <input type="date" value={formData.lastBillDate} onChange={e => setFormData({...formData, lastBillDate: e.target.value})} />
            <input placeholder="Opening Balance" type="number" value={formData.previousBalance} onChange={e => setFormData({...formData, previousBalance: e.target.value})} />
          </div>
          <div className="form-actions">
            <button type="submit" className="save-btn">{editId ? "Update" : "Save"}</button>
            <button type="button" className="cancel-btn" onClick={resetForm}>Cancel</button>
          </div>
        </form>
      ) : (
        <div className="supplier-list">
          <table>
            <thead>
              <tr>
                <th>Name / Mobile</th>
                <th>GSTIN</th>
                <th>Last Bill / Date</th>
                <th>Balance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.length > 0 ? (
                filteredSuppliers.map((s) => (
                  <tr key={s._id}>
                    <td>
                      <strong>{s.name}</strong><br/>
                      <small style={{color: '#666'}}>{s.phone || "No Mobile"}</small>
                    </td>
                    <td>{s.gstin || "N/A"}</td>
                    <td>
                      {s.lastBillNo || "---"}<br/>
                      <small>{s.lastBillDate ? new Date(s.lastBillDate).toLocaleDateString() : "No Date"}</small>
                    </td>
                    <td className="total-cell">₹{s.totalOwed}</td>
                    <td>
                      <button className="edit-icon" onClick={() => handleEdit(s)}>✏️</button>
                      <button className="delete-icon" onClick={() => handleDelete(s._id)}>🗑️</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                    No matching suppliers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <CustomSnackbar 
        open={snackbar.open} 
        message={snackbar.message} 
        severity={snackbar.severity} 
        onClose={() => setSnackbar({ ...snackbar, open: false })} 
      />
    </div>
  );
};

export default SupplierManager;