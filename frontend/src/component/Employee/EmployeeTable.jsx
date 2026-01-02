import React, { useState, useEffect } from 'react';
import axios from 'axios'; 
import { useNavigate } from "react-router-dom";
import Loader from '../Core_Component/Loader/Loader';
import './Emp.css';

const EmployeeTable = ({ role }) => { 
  // 🔐 Permission Check
  const isAuthorized = role === "Admin" || role === "Accountant";

  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null); 
  const [editData, setEditData] = useState({});
  const navigate = useNavigate();

  // Live Backend URL handle karne ke liye
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  // 1️⃣ Fetch Data from MongoDB
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/employees`);
      if (res.data.success) {
        setEmployees(res.data.data);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      alert("Error loading employee data from live server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [API_URL]);

  const startEdit = (emp) => {
    if (!isAuthorized) {
      alert("Unauthorized: Aapko edit karne ki permission nahi hai.");
      return;
    }
    setEditId(emp._id); 
    setEditData({ ...emp });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  // 2️⃣ Update Logic (Live MongoDB PUT)
  const handleSave = async () => {
    if (!isAuthorized) return;
    try {
      const res = await axios.put(`${API_URL}/api/employees/${editData.employeeId}`, {
        ...editData,
        adminName: "Admin" 
      });

      if (res.data.success) {
        alert("✅ Employee Updated Successfully!");
        setEditId(null);
        fetchEmployees(); 
      }
    } catch (err) {
      alert("Update Error: " + (err.response?.data?.message || err.message));
    }
  };

  // 3️⃣ Delete Logic (Live MongoDB DELETE)
  const handleDelete = async (id, empName) => {
    if (!isAuthorized) {
      alert("Unauthorized: Aapko delete karne ki permission nahi hai.");
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${empName}?`)) {
      try {
        const res = await axios.delete(`${API_URL}/api/employees/${id}`);
        if (res.data.success) {
          alert("🗑️ Employee Deleted!");
          fetchEmployees();
        }
      } catch (err) {
        alert("Delete Failed: " + err.message);
      }
    }
  };

  const filtered = employees.filter(emp => 
    emp.name?.toLowerCase().includes(search.toLowerCase()) || 
    emp.aadhar?.includes(search) ||
    emp.employeeId?.toString().includes(search)
  );

  if (loading) return <Loader />;

  return (
    <div className="table-container-wide">
      <div className="table-card-wide">
        <div className="table-header-row">
          <h2 className="table-title">EMPLOYEE DIRECTORY (Live)</h2>
          <div className="search-wrapper">
            <input 
              type="text" 
              placeholder="Search ID, Name or Aadhar..." 
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
                <th>SI</th>
                <th>Emp ID</th>
                <th>Photo</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp, index) => (
                <tr key={emp._id} className={editId === emp._id ? "active-edit-row" : ""}>
                  <td>{index + 1}</td>
                  
                  <td style={{fontWeight: 'bold', color: '#2563eb'}}>
                    {emp.employeeId || '---'}
                  </td>

                  <td>
                    <div className="emp-profile-circle">
                      {emp.photo ? (
                        <img src={emp.photo} alt="Profile" />
                      ) : (
                        <div className="placeholder-avatar">
                          {emp.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="cust-name-cell">
                    {editId === emp._id ? 
                      <input name="name" value={editData.name} onChange={handleEditChange} className="edit-input-field" /> 
                      : emp.name}
                  </td>
                  
                  <td>
                    {editId === emp._id ? 
                      <input name="phone" value={editData.phone} onChange={handleEditChange} className="edit-input-field" /> 
                      : emp.phone}
                  </td>

                  <td className="action-btns-cell">
                    {editId === emp._id ? (
                      <div className="btn-group-row">
                        <button className="save-btn-ui" onClick={handleSave}>💾 Save</button>
                        <button className="cancel-btn-ui" onClick={() => setEditId(null)}>✖</button>
                      </div>
                    ) : (
                      <div className="btn-group-row">
                        <button 
                          className="row-edit-btn" 
                          onClick={() => startEdit(emp)} 
                          disabled={!isAuthorized}
                          style={{ opacity: isAuthorized ? 1 : 0.5 }}
                        >✏️</button>

                        <button 
                          className="row-delete-btn" 
                          onClick={() => handleDelete(emp._id, emp.name)} 
                          disabled={!isAuthorized}
                          style={{ opacity: isAuthorized ? 1 : 0.5 }}
                        >🗑️</button>

                        <button 
                          className="ledger-btn-ui" 
                          onClick={() => handleNavigate(`/staff-ledger/${emp._id}`)}
                          title="View Details"
                        >👁️</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="no-records-box">
              {search ? `No results found for "${search}"` : "No employees registered yet."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeTable;