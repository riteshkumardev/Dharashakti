import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue, set } from "firebase/database";
import { app } from "../../redux/api/firebase/firebase";
import './Attendanc.css'; // Ensure path is correct


const Attendance = () => {
  const db = getDatabase(app);
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // 1. Employees Load Karein
  useEffect(() => {
    const empRef = ref(db, "employees");
    const unsubscribe = onValue(empRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // ID, Name aur metadata ko sahi se map kiya
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
    return () => unsubscribe(); // Cleanup to prevent memory leaks
  }, [db]);

  // 2. Selected Date ki Attendance Load Karein
  useEffect(() => {
    const attRef = ref(db, `attendance/${date}`);
    const unsubscribe = onValue(attRef, (snapshot) => {
      setAttendance(snapshot.val() || {});
    });
    return () => unsubscribe();
  }, [date, db]);

  // 3. Hazri Lagane ka Function
  const markAttendance = (empId, empName, status) => {
    const attRef = ref(db, `attendance/${date}/${empId}`);
    set(attRef, {
      name: empName || "Unknown",
      status: status,
      time: new Date().toLocaleTimeString(),
      timestamp: Date.now() // Analysis ke liye zaroori hai
    }).catch(err => alert("Error marking attendance: " + err.message));
  };

  // Search Logic: Name, Aadhar, aur 8-digit Employee ID teeno par chalega
  const filteredEmployees = employees.filter(emp => {
    const searchTerm = search.toLowerCase();
    return (
      emp.name?.toLowerCase().includes(searchTerm) || 
      emp.employeeId?.toString().includes(searchTerm) ||
      emp.aadhar?.toString().includes(searchTerm)
    );
  });

  if (loading) return <div className="no-records-box">Loading Staff Directory...</div>;

  return (
    <div className="table-container-wide">
      <div className="table-card-wide">
        
        {/* Header Section */}
        <div className="table-header-row">
          <div>
            <h2 className="table-title">DAILY ATTENDANCE</h2>
            <p style={{fontSize: '12px', color: '#666', margin: 0}}>Hazri lagane ke liye P (Present), A (Absent), ya H (Half-Day) dabayein</p>
          </div>
          
          <div className="btn-group-row" style={{gap: '12px'}}>
            <input 
              type="text" 
              placeholder="Search ID or Name..." 
              className="table-search-box"
              style={{width: '220px'}}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <input 
              type="date" 
              className="table-search-box" 
              value={date} 
              max={new Date().toISOString().split('T')[0]} // Future date block ki
              onChange={(e) => setDate(e.target.value)} 
            />
          </div>
        </div>

        {/* Attendance Table */}
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
                      <td style={{fontWeight: 'bold', color: '#2563eb'}}>
                          {emp.employeeId || 'NEW'}
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
                          >P</button>
                          
                          <button 
                            className={`row-delete-btn ${currentStatus === 'Absent' ? 'active-a' : ''}`} 
                            onClick={() => markAttendance(emp.firebaseId, emp.name, 'Absent')}
                          >A</button>
                          
                          <button 
                            className={`ledger-btn-ui ${currentStatus === 'Half-Day' ? 'active-h' : ''}`} 
                            onClick={() => markAttendance(emp.firebaseId, emp.name, 'Half-Day')}
                          >H</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="no-records-box">
                    {search ? `"${search}" ke liye koi record nahi mila.` : "Staff list khali hai."}
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