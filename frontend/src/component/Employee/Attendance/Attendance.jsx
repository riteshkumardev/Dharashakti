import React, { useState, useEffect } from 'react';
import axios from 'axios'; 
import './Attendanc.css';
import Loader from '../../Core_Component/Loader/Loader';

const Attendance = ({ role }) => {
  const isAuthorized = role === "Admin" || role === "Accountant";

  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // 🆕 Bulk Mode & Selection States
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkStartDate, setBulkStartDate] = useState('');
  const [bulkEndDate, setBulkEndDate] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState([]); // List of IDs

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const maskID = (id) => {
    if (!id) return "---";
    const strID = id.toString();
    return strID.length <= 4 ? strID : "XXXX" + strID.slice(-4);
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/employees`);
      if (res.data.success) {
        setEmployees(res.data.data);
        // Default: Select all in the list initially
        setSelectedEmployees(res.data.data.map(e => e.employeeId));
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/attendance/${date}`);
      if (res.data.success) {
        const attObj = {};
        res.data.data.forEach(item => { attObj[item.employeeId] = item; });
        setAttendance(attObj);
      }
    } catch (err) { setAttendance({}); }
  };

  useEffect(() => { fetchEmployees(); }, [API_URL]);
  useEffect(() => { if (!isBulkMode) fetchAttendance(); }, [date, API_URL, isBulkMode]);

  // 1️⃣ MARK SINGLE ATTENDANCE
  const markAttendance = async (empId, empName, status) => {
    if (!isAuthorized) return alert("Permission denied.");
    try {
      const res = await axios.post(`${API_URL}/api/attendance`, {
        employeeId: empId, name: empName, status: status, date: date
      });
      if (res.data.success) {
        setAttendance(prev => ({
          ...prev, [empId]: { status, time: new Date().toLocaleTimeString() }
        }));
      }
    } catch (err) { alert("Error: " + (err.response?.data?.message || err.message)); }
  };

  // 2️⃣ MANUAL SELECTION LOGIC
  const toggleSelect = (id) => {
    setSelectedEmployees(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedEmployees(filteredEmployees.map(e => e.employeeId));
    } else {
      setSelectedEmployees([]);
    }
  };

  // 3️⃣ MARK BULK ATTENDANCE (Range & Filtered List)
  const handleBulkAttendance = async (status) => {
    if (!bulkStartDate || !bulkEndDate) return alert("Pehle Start aur End date chuniye.");
    if (selectedEmployees.length === 0) return alert("Kam se kam ek employee select karein.");
    
    if (!window.confirm(`Selected ${selectedEmployees.length} employees ko ${bulkStartDate} se ${bulkEndDate} tak '${status}' mark karein?`)) return;

    setLoading(true);
    try {
      const payload = {
        employeeIds: selectedEmployees, 
        startDate: bulkStartDate,
        endDate: bulkEndDate,
        status: status
      };

      const res = await axios.post(`${API_URL}/api/attendance/bulk`, payload);
      if (res.data.success) {
        alert(`Success: Updated ${selectedEmployees.length} records!`);
        setIsBulkMode(false);
        fetchAttendance();
      }
    } catch (err) {
      alert("Bulk Update failed. Backend route '/api/attendance/bulk' exists?");
    } finally { setLoading(false); }
  };

  const filteredEmployees = employees.filter(emp => {
    const searchTerm = search.toLowerCase();
    return (emp.name?.toLowerCase().includes(searchTerm) || emp.employeeId?.toString().includes(searchTerm));
  });

  if (loading) return <Loader />;

  return (
    <div className="table-container-wide">
      <div className="table-card-wide">
        <div className="table-header-row">
          <div>
            <h2 className="table-title">{isBulkMode ? "BULK SELECTION MODE" : "DAILY ATTENDANCE"}</h2>
            <button 
                onClick={() => setIsBulkMode(!isBulkMode)}
                className="ledger-btn-ui" 
                style={{marginTop: '5px', padding: '4px 12px', fontSize: '12px'}}
            >
              {isBulkMode ? "Back to Daily" : "📅 Bulk Back-Date Fill"}
            </button>
          </div>
          
          <div className="btn-group-row" style={{gap: '12px', flexWrap: 'wrap'}}>
            {isBulkMode ? (
           <>
  {/* 📅 From Date Picker */}
  <div style={{
      display: 'flex', 
      alignItems: 'center', 
      gap: '10px', 
      background: '#ffffff', 
      padding: '8px 18px', 
      borderRadius: '30px', 
      border: '2px solid #4d47f3', 
      boxShadow: '0 4px 10px rgba(77, 71, 243, 0.15)',
      minWidth: '220px'
  }}>
    <label style={{
        fontSize: '11px', 
        fontWeight: '900', 
        color: '#4d47f3', 
        textTransform: 'uppercase',
        letterSpacing: '1px'
    }}>
      From:
    </label>
    <input 
      type="date" 
      value={bulkStartDate} 
      onChange={(e) => setBulkStartDate(e.target.value)} 
      style={{
          background: 'transparent',
          border: 'none',
          color: '#333333', 
          fontSize: '14px',
          fontWeight: '700',
          outline: 'none',
          cursor: 'pointer',
          width: '100%'
      }}
    />
  </div>

  {/* 📅 To Date Picker */}
  <div style={{
      display: 'flex', 
      alignItems: 'center', 
      gap: '10px', 
      background: '#ffffff', 
      padding: '8px 18px', 
      borderRadius: '30px', 
      border: '2px solid #4d47f3', 
      boxShadow: '0 4px 10px rgba(77, 71, 243, 0.15)',
      minWidth: '220px'
  }}>
    <label style={{
        fontSize: '11px', 
        fontWeight: '900', 
        color: '#4d47f3', 
        textTransform: 'uppercase',
        letterSpacing: '1px'
    }}>
      To:
    </label>
    <input 
      type="date" 
      value={bulkEndDate} 
      onChange={(e) => setBulkEndDate(e.target.value)} 
      style={{
          background: 'transparent',
          border: 'none',
          color: '#333333', 
          fontSize: '14px',
          fontWeight: '700',
          outline: 'none',
          cursor: 'pointer',
          width: '100%'
      }}
    />
  </div>
</>
            ) : (
         <>
  {/* 🔍 Compact 3D Search Box */}
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#ffffff',
    padding: '6px 14px',
    borderRadius: '12px',
    border: '2px solid #4d47f3',
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.1)',
    width: '220px'
  }}>
    <span style={{ fontSize: '14px' }}>🔍</span>
    <input 
      type="text" 
      placeholder="Search..." 
      value={search} 
      onChange={(e) => setSearch(e.target.value)} 
      style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px', fontWeight: '600', color: '#000000' }}
    />
  </div>

  {/* 📅 Compact 3D Daily Date */}
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#ffffff',
    padding: '6px 14px',
    borderRadius: '12px',
    border: '2px solid #4d47f3',
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.1)',
    minWidth: '180px'
  }}>
    <label style={{ fontSize: '11px', fontWeight: '900', color: '#4d47f3', textTransform: 'uppercase' }}>Date:</label>
    <input 
      type="date" 
      value={date} 
      onChange={(e) => setDate(e.target.value)} 
      style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', fontWeight: '700', color: '#000000', cursor: 'pointer' }}
    />
  </div>
</>
            )}
          </div>
        </div>

        <div className="table-responsive-wrapper">
          <table className="modern-sales-table">
            <thead>
              <tr>
                {isBulkMode && (
                  <th style={{width: '40px'}}>
                    <input type="checkbox" onChange={handleSelectAll} checked={selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0} />
                  </th>
                )}
                <th>Emp ID</th>
                <th>Photo</th>
                <th>Name</th>
                <th>{isBulkMode ? "Include in Bulk?" : "Status"}</th>
                <th style={{textAlign: 'center'}}>{isBulkMode ? "Status Info" : "Action"}</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => {
                const currentStatus = attendance[emp.employeeId]?.status;
                const isSelected = selectedEmployees.includes(emp.employeeId);
                return (
                  <tr key={emp._id} style={{backgroundColor: (isBulkMode && isSelected) ? '#f0fff4' : ''}}>
                    {isBulkMode && (
                      <td>
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(emp.employeeId)} />
                      </td>
                    )}
                    <td>{maskID(emp.employeeId)}</td>
                    <td>
                      <div className="emp-profile-circle">
                        {emp.photo ? <img src={emp.photo} alt="profile" /> : <div className="placeholder-avatar">{emp.name?.charAt(0)}</div>}
                      </div>
                    </td>
                    <td>
                      <div style={{fontWeight: '600'}}>{emp.name}</div>
                      <div style={{fontSize: '11px', color: '#888'}}>{emp.designation}</div>
                    </td>
                    <td>
                      {isBulkMode ? (
                        <span style={{color: isSelected ? 'green' : '#999', fontWeight: 'bold'}}>
                          {isSelected ? "Included ✅" : "Excluded ❌"}
                        </span>
                      ) : (
                        <span className={`status-badge-pill ${currentStatus === 'Present' ? 'success-bg' : currentStatus === 'Absent' ? 'null-bg' : 'warning-bg'}`}>
                          {currentStatus || 'Pending'}
                        </span>
                      )}
                    </td>
                    <td style={{textAlign: 'center'}}>
                      {!isBulkMode ? (
                        <div className="btn-group-row" style={{justifyContent: 'center', gap: '8px'}}>
                          <button className="save-btn-ui" onClick={() => markAttendance(emp.employeeId, emp.name, 'Present')}>P</button>
                          <button className="row-delete-btn" onClick={() => markAttendance(emp.employeeId, emp.name, 'Absent')}>A</button>
                          {/* 🆕 Single Action "H" Button Added */}
                          <button className="ledger-btn-ui" style={{background: '#ffc107', color: '#000'}} onClick={() => markAttendance(emp.employeeId, emp.name, 'Half-Day')}>H</button>
                        </div>
                      ) : (
                        <span style={{fontSize: '12px', fontStyle: 'italic'}}>{isSelected ? "Active for update" : "Skip"}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {isBulkMode && (
          <div className="bulk-footer" style={{padding: '20px', background: '#f9f9f9', textAlign: 'center', borderTop: '1px solid #ddd'}}>
            <h4 style={{margin: '0 0 10px 0'}}>Processing {selectedEmployees.length} Employees:</h4>
            <div className="btn-group-row" style={{justifyContent: 'center', gap: '15px'}}>
              <button className="save-btn-ui" style={{padding: '10px 30px'}} onClick={() => handleBulkAttendance('Present')}>Apply Present</button>
              <button className="row-delete-btn" style={{padding: '10px 30px'}} onClick={() => handleBulkAttendance('Absent')}>Apply Absent</button>
              <button className="ledger-btn-ui" style={{padding: '10px 30px'}} onClick={() => handleBulkAttendance('Holiday')}>Apply Holiday</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;