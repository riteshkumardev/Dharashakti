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

  const maskID = (id) => {
    if (!id) return "---";
    const strID = id.toString();
    if (strID.length <= 4) return strID;
    return "XXXX" + strID.slice(-4);
  };

  // 1️⃣ Fetch All Employees from MongoDB
  const fetchEmployees = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/employees");
      if (res.data.success) setEmployees(res.data.data);
    } catch (err) {
      console.error("Error fetching employees:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2️⃣ Fetch Attendance for Selected Date from MongoDB
  const fetchAttendance = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/attendance/${date}`);
      if (res.data.success) {
        // Convert array to object format for easy lookup: { empId: { status, time } }
        const attObj = {};
        res.data.data.forEach(item => {
          attObj[item.employeeId] = item;
        });
        setAttendance(attObj);
      }
    } catch (err) {
      setAttendance({});
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [date]);

  // 3️⃣ Mark Attendance in MongoDB
  const markAttendance = async (empId, empName, status) => {
    if (!isAuthorized) {
      alert("Aapko attendance mark karne ki permission nahi hai.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/attendance", {
        employeeId: empId,
        name: empName,
        status: status,
        date: date
      });

      if (res.data.success) {
        // Local state update karein taki UI turant change ho
        setAttendance(prev => ({
          ...prev,
          [empId]: { status, time: new Date().toLocaleTimeString() }
        }));
      }
    } catch (err) {
      alert("Error marking attendance: " + (err.response?.data?.message || err.message));
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const searchTerm = search.toLowerCase();
    return (
      emp.name?.toLowerCase().includes(searchTerm) || 
      emp.employeeId?.toString().includes(searchTerm) ||
      emp.aadhar?.toString().includes(searchTerm)
    );
  });

  if (loading) return <Loader />;

  return (
    <div className="table-container-wide">
      <div className="table-card-wide">
        <div className="table-header-row">
          <div>
            <h2 className="table-title">DAILY ATTENDANCE (MongoDB)</h2>
            <p style={{fontSize: '12px', color: '#666', margin: 0}}>
              {isAuthorized 
                ? "Hazri lagane ke liye P, A, ya H dabayein" 
                : "⚠️ View Only Mode"}
            </p>
          </div>
          
          <div className="btn-group-row" style={{gap: '12px'}}>
            <input 
              type="text" 
              placeholder="Search Name or ID..." 
              className="table-search-box"
              style={{width: '220px'}}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <input 
              type="date" 
              className="table-search-box" 
              value={date} 
              max={new Date().toISOString().split('T')[0]} 
              onChange={(e) => setDate(e.target.value)} 
            />
          </div>
        </div>

        <div className="table-responsive-wrapper">
          <table className="modern-sales-table">
            <thead>
              <tr>
                <th>Emp ID</th>
                <th>Photo</th>
                <th>Name</th>
                <th>Current Status</th>
                <th style={{textAlign: 'center'}}>Mark Attendance</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((emp) => {
                  const currentStatus = attendance[emp.employeeId]?.status;
                  
                  return (
                    <tr key={emp._id}>
                      <td style={{fontWeight: 'bold', color: '#2563eb'}}>
                          {emp.employeeId ? maskID(emp.employeeId) : 'NEW'}
                      </td>

                      <td>
                        <div className="emp-profile-circle">
                          {emp.photo ? (
                            <img src={emp.photo} alt="profile" />
                          ) : (
                            <div className="placeholder-avatar">{emp.name?.charAt(0)}</div>
                          )}
                        </div>
                      </td>

                      <td className="cust-name-cell">
                        <div style={{fontWeight: '600'}}>{emp.name}</div>
                        <div style={{fontSize: '11px', color: '#888'}}>{emp.designation}</div>
                      </td>

                      <td>
                        <span className={`status-badge-pill ${
                          currentStatus === 'Present' ? 'success-bg' : 
                          currentStatus === 'Absent' ? 'null-bg' : 
                          currentStatus === 'Half-Day' ? 'warning-bg' : 'warning-bg'
                        }`}>
                          {currentStatus || 'Pending'}
                        </span>
                      </td>

                      <td className="action-btns-cell" style={{textAlign: 'center'}}>
                        <div className="btn-group-row" style={{justifyContent: 'center', gap: '8px'}}>
                          <button 
                            className={`save-btn-ui ${currentStatus === 'Present' ? 'active-p' : ''}`} 
                            onClick={() => markAttendance(emp.employeeId, emp.name, 'Present')}
                            disabled={!isAuthorized}
                          >P</button>
                          
                          <button 
                            className={`row-delete-btn ${currentStatus === 'Absent' ? 'active-a' : ''}`} 
                            onClick={() => markAttendance(emp.employeeId, emp.name, 'Absent')}
                            disabled={!isAuthorized}
                          >A</button>
                          
                          <button 
                            className={`ledger-btn-ui ${currentStatus === 'Half-Day' ? 'active-h' : ''}`} 
                            onClick={() => markAttendance(emp.employeeId, emp.name, 'Half-Day')}
                            disabled={!isAuthorized}
                          >H</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="no-records-box">No results found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Attendance;