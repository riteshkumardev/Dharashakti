import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue, set } from "firebase/database";
import { app } from "../../../redux/api/firebase/firebase";
import './Attendanc.css';
import Loader from '../../Core_Component/Loader/Loader';

const Attendance = ({ role }) => {
  const db = getDatabase(app);
  
  const isAuthorized = role === "Admin" || role === "Accountant";

  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // 🛡️ Helper Function: ID ko chhupane ke liye (Ex: 12345678 -> XXXX5678)
  const maskID = (id) => {
    if (!id) return "---";
    const strID = id.toString();
    if (strID.length <= 4) return strID; // Agar ID bahut chhoti hai
    return "XXXX" + strID.slice(-4); // Shuru ke characters ki jagah XXXX aur aakhri 4 digits
  };

  useEffect(() => {
    const empRef = ref(db, "employees");
    const unsubscribe = onValue(empRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ 
          firebaseId: key, 
          ...data[key] 
        }));
        setEmployees(list);
      } else {
        setEmployees([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [db]);

  useEffect(() => {
    const attRef = ref(db, `attendance/${date}`);
    const unsubscribe = onValue(attRef, (snapshot) => {
      setAttendance(snapshot.val() || {});
    });
    return () => unsubscribe();
  }, [date, db]);

  const markAttendance = (empId, empName, status) => {
    if (!isAuthorized) {
      alert("Aapko attendance mark karne ki permission nahi hai.");
      return;
    }

    const attRef = ref(db, `attendance/${date}/${empId}`);
    set(attRef, {
      name: empName || "Unknown",
      status: status,
      time: new Date().toLocaleTimeString(),
      timestamp: Date.now()
    }).catch(err => alert("Error marking attendance: " + err.message));
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
            <h2 className="table-title">DAILY ATTENDANCE</h2>
            <p style={{fontSize: '12px', color: '#666', margin: 0}}>
              {isAuthorized 
                ? "Hazri lagane ke liye P (Present), A (Absent), ya H (Half-Day) dabayein" 
                : "⚠️ View Only: Aapko attendance mark karne ki permission nahi hai."}
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
                  const currentStatus = attendance[emp.firebaseId]?.status;
                  
                  return (
                    <tr key={emp.firebaseId}>
                      <td style={{fontWeight: 'bold', color: '#2563eb', letterSpacing: '1px'}}>
                          {/* 🔒 Masked ID yahan dikhayi degi */}
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
                            onClick={() => markAttendance(emp.firebaseId, emp.name, 'Present')}
                            disabled={!isAuthorized}
                            style={{ opacity: isAuthorized ? 1 : 0.5, cursor: isAuthorized ? "pointer" : "not-allowed" }}
                          >P</button>
                          
                          <button 
                            className={`row-delete-btn ${currentStatus === 'Absent' ? 'active-a' : ''}`} 
                            onClick={() => markAttendance(emp.firebaseId, emp.name, 'Absent')}
                            disabled={!isAuthorized}
                            style={{ opacity: isAuthorized ? 1 : 0.5, cursor: isAuthorized ? "pointer" : "not-allowed" }}
                          >A</button>
                          
                          <button 
                            className={`ledger-btn-ui ${currentStatus === 'Half-Day' ? 'active-h' : ''}`} 
                            onClick={() => markAttendance(emp.firebaseId, emp.name, 'Half-Day')}
                            disabled={!isAuthorized}
                            style={{ opacity: isAuthorized ? 1 : 0.5, cursor: isAuthorized ? "pointer" : "not-allowed" }}
                          >H</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="no-records-box">
                    No results found.
                  </td>
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