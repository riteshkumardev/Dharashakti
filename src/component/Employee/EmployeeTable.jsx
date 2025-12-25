import React, { useState, useEffect } from 'react';
import './Emp.css';
import { getDatabase, ref, onValue, remove, update } from "firebase/database";
import { app } from "../../redux/api/firebase/firebase";
import { useNavigate } from "react-router-dom";
 
const EmployeeTable = ({ onViewDetails }) => {
  const db = getDatabase(app);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
 const navigate = useNavigate();
  useEffect(() => {
    const empRef = ref(db, "employees");
    const unsubscribe = onValue(empRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map((key) => ({
          firebaseId: key,
          ...data[key],
        }));
        setEmployees(list.reverse());
      } else {
        setEmployees([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [db]);

  const startEdit = (emp) => {
    setEditId(emp.firebaseId);
    setEditData({ ...emp });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };
  const handleNavigate = (path) => {
    navigate(path);
    
  };

  const handleSave = async () => {
    try {
      await update(ref(db, `employees/${editId}`), editData);
      alert("Employee Updated Successfully!");
      setEditId(null);
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      remove(ref(db, `employees/${id}`));
    }
  };

  // --- Search Logic: ID, Name, aur Aadhar teeno par kaam karega ---
  const filtered = employees.filter(emp => 
    emp.name?.toLowerCase().includes(search.toLowerCase()) || 
    emp.aadhar?.includes(search) ||
    emp.employeeId?.toString().includes(search) // ID search fix
  );

  if (loading) return <div className="no-records-box">Loading Staff Directory...</div>;

  return (
    <div className="table-container-wide">
      <div className="table-card-wide">
        <div className="table-header-row">
          <h2 className="table-title">EMPLOYEE DIRECTORY</h2>
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
                <th>Emp ID</th> {/* Naya ID Column */}
                <th>Photo</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp, index) => (
                <tr key={emp.firebaseId} className={editId === emp.firebaseId ? "active-edit-row" : ""}>
                  <td>{index + 1}</td>
                  
                  {/* Employee ID Display */}
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
                    {editId === emp.firebaseId ? 
                      <input name="name" value={editData.name} onChange={handleEditChange} className="edit-input-field" /> 
                      : emp.name}
                  </td>
                  
                  <td>
                    {editId === emp.firebaseId ? 
                      <input name="phone" value={editData.phone} onChange={handleEditChange} className="edit-input-field" /> 
                      : emp.phone}
                  </td>

                  <td className="action-btns-cell">
                    {editId === emp.firebaseId ? (
                      <div className="btn-group-row">
                        <button className="save-btn-ui" onClick={handleSave}>💾 Save</button>
                        <button className="cancel-btn-ui" onClick={() => setEditId(null)}>✖</button>
                      </div>
                    ) : (
                      <div className="btn-group-row">
                        <button className="row-edit-btn" onClick={() => startEdit(emp)} title="Edit">✏️</button>
                        <button className="row-delete-btn" onClick={() => handleDelete(emp.firebaseId)} title="Delete">🗑️</button>
                        <button 
                          className="ledger-btn-ui" 
                          onClick={() => handleNavigate("/staff-ledger")}
                          title="View Details"
                        >
                          👁️
                        </button>
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