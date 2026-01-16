import React, { useState, useEffect } from 'react';
import axios from 'axios'; 
import { useNavigate } from "react-router-dom";
import Loader from '../Core_Component/Loader/Loader';
import './Emp.css';

const EmployeeTable = ({ role }) => { 
  const isAuthorized = role === "Admin" || role === "Accountant";

  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null); 
  const [editData, setEditData] = useState({});
  const navigate = useNavigate();

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/employees`);
      if (res.data.success) {
        setEmployees(res.data.data);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [API_URL]);

  const startEdit = (emp) => {
    if (!isAuthorized) {
      alert("Unauthorized: Permission denied.");
      return;
    }
    setEditId(emp._id); 
    setEditData({ ...emp });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = async (e, empId) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("photo", file);
    formData.append("employeeId", empId);

    try {
      const res = await axios.post(`${API_URL}/api/profile/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      if (res.data.success) {
        alert("✅ Photo Updated!");
        fetchEmployees(); 
      }
    } catch (err) {
      alert("Upload failed");
    }
  };

  const handleSave = async () => {
    if (!isAuthorized) return;
    try {
      const res = await axios.put(`${API_URL}/api/employees/${editData.employeeId}`, {
        ...editData
      });

      if (res.data.success) {
        alert("✅ Employee Data Updated!");
        setEditId(null);
        fetchEmployees(); 
      }
    } catch (err) {
      alert("Update Error: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id, empName) => {
    if (!isAuthorized) return;
    if (window.confirm(`Delete ${empName}?`)) {
      try {
        const res = await axios.delete(`${API_URL}/api/employees/${id}`);
        if (res.data.success) {
          alert("🗑️ Deleted!");
          fetchEmployees();
        }
      } catch (err) {
        alert("Delete Failed");
      }
    }
  };

  const filtered = employees.filter(emp => 
    emp.name?.toLowerCase().includes(search.toLowerCase()) || 
    emp.employeeId?.toString().includes(search) ||
    emp.aadhar?.includes(search)
  );

  if (loading) return <Loader />;

  return (
    <div className="table-container-wide">
      <div className="table-card-wide">
        <div className="table-header-row">
          <h2 className="table-title">STAFF DIRECTORY & BANK RECORDS</h2>
          <div className="search-wrapper">
            <input 
              type="text" 
              placeholder="Search Name, ID or Aadhar..." 
              className="table-search-box"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-responsive-wrapper">
          <table className="modern-sales-table">
            <thead>
              <tr>
                <th>Emp ID</th>
                <th>Photo</th>
                <th>Basic Info</th>
                <th>Bank Details</th>
                <th>Financials</th>
                <th>Joining Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => (
                <tr key={emp._id} className={editId === emp._id ? "active-edit-row" : ""}>
                  
                  <td style={{fontWeight: '800', color: '#1e293b'}}>{emp.employeeId}</td>

                  {/* 📸 FIXED PHOTO SECTION */}
                  <td>
                    <div className="emp-profile-circle edit-photo-wrapper">
                      <img 
                        src={emp.photo ? (emp.photo.startsWith('http') ? emp.photo : `${API_URL}${emp.photo}`) : "https://i.imgur.com/6VBx3io.png"} 
                        alt="Profile" 
                        onError={(e) => { e.target.src = "https://i.imgur.com/6VBx3io.png"; }}
                      />
                      {isAuthorized && (
                        <label className="table-photo-edit-overlay">
                          📸
                          <input type="file" hidden onChange={(e) => handlePhotoChange(e, emp.employeeId)} />
                        </label>
                      )}
                    </div>
                  </td>

                  <td>
                    {editId === emp._id ? (
                      <div className="edit-cell-group">
                        <input name="name" value={editData.name} onChange={handleEditChange} className="edit-input-field" placeholder="Name" />
                        <input name="phone" value={editData.phone} onChange={handleEditChange} className="edit-input-field" placeholder="Phone" />
                        <input name="aadhar" value={editData.aadhar} onChange={handleEditChange} className="edit-input-field" placeholder="Aadhar" />
                      </div>
                    ) : (
                      <div className="cell-stack">
                        <span className="main-text">{emp.name}</span>
                        <span className="sub-text">📞 {emp.phone}</span>
                        <span className="sub-text">🆔 AD: {emp.aadhar || '---'}</span>
                        <span className="role-badge">{emp.role}</span>
                      </div>
                    )}
                  </td>

                  <td>
                    {editId === emp._id ? (
                      <div className="edit-cell-group">
                        <input name="accountNo" value={editData.accountNo} onChange={handleEditChange} className="edit-input-field" placeholder="A/C No" />
                        <input name="bankName" value={editData.bankName} onChange={handleEditChange} className="edit-input-field" placeholder="Bank Name" />
                        <input name="ifscCode" value={editData.ifscCode} onChange={handleEditChange} className="edit-input-field" placeholder="IFSC Code" />
                      </div>
                    ) : (
                      <div className="cell-stack">
                        <span className="main-text" style={{fontSize: '11px'}}>{emp.accountNo || 'N/A'}</span>
                        <span className="sub-text">{emp.bankName || 'Bank Name'}</span>
                        <span className="ifsc-text">{emp.ifscCode || 'IFSC'}</span>
                      </div>
                    )}
                  </td>

                  <td>
                    {editId === emp._id ? (
                      <div className="edit-cell-group">
                        <input name="designation" value={editData.designation} onChange={handleEditChange} className="edit-input-field" placeholder="Designation" />
                        <input name="salary" type="number" value={editData.salary} onChange={handleEditChange} className="edit-input-field" placeholder="Salary" />
                      </div>
                    ) : (
                      <div className="cell-stack">
                        <span className="salary-text">₹{Number(emp.salary).toLocaleString()}</span>
                        <span className="sub-text">{emp.designation}</span>
                      </div>
                    )}
                  </td>

                  <td>
                    {editId === emp._id ? (
                      <input name="joiningDate" type="date" value={editData.joiningDate?.split('T')[0]} onChange={handleEditChange} className="edit-input-field" />
                    ) : (
                      <span className="sub-text">{new Date(emp.joiningDate).toLocaleDateString()}</span>
                    )}
                  </td>

                  <td className="action-btns-cell">
                    {editId === emp._id ? (
                      <div className="btn-group-row">
                        <button className="save-btn-ui" onClick={handleSave}>💾 Save</button>
                        <button className="cancel-btn-ui" onClick={() => setEditId(null)}>✖</button>
                      </div>
                    ) : (
                      <div className="btn-group-row">
                        <button className="row-edit-btn" onClick={() => startEdit(emp)} disabled={!isAuthorized}>✏️</button>
                        <button className="row-delete-btn" onClick={() => handleDelete(emp._id, emp.name)} disabled={!isAuthorized}>🗑️</button>
                        <button className="ledger-btn-ui" onClick={() => navigate(`/staff-ledger/${emp._id}`)}>👁️</button>
                      </div>
                    )}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmployeeTable;