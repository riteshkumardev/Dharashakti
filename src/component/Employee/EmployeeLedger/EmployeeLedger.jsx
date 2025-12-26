import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue, push } from "firebase/database";
import { app } from "../../../redux/api/firebase/firebase";
import Calendar from 'react-calendar'; 
import 'react-calendar/dist/Calendar.css'; 
import './EmployeeLedger.css';
import Loader from "../../Core_Component/Loader/Loader";

// 👈 role aur user props App.js se aa rahe hain
const EmployeeLedger = ({ role, user }) => {
  const db = getDatabase(app);
  
  // 🔐 Permissions Setup
  const isAuthorized = role === "Admin" || role === "Accountant";
  const isBoss = role === "Admin" || role === "Manager";

  // State Management
  const [employees, setEmployees] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, absent: 0 });
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [fullAttendanceData, setFullAttendanceData] = useState({});
  
  // ⏳ Loading States
  const [loading, setLoading] = useState(true); 
  const [fetchingDetail, setFetchingDetail] = useState(false);

  // 🛡️ Helper: ID Masking (Ex: 12345678 -> XXXX5678)
  const maskID = (id) => {
    if (!id) return "---";
    const strID = id.toString();
    return strID.length > 4 ? "XXXX" + strID.slice(-4) : strID;
  };

  // 1. Employees Load Logic (Sirf Management ke liye)
  useEffect(() => {
    // Agar boss nahi hai, toh loader band karke ruk jao
    if (!isBoss) {
      setLoading(false);
      return;
    }

    const empRef = ref(db, "employees");
    const unsubscribe = onValue(empRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(k => ({ id: k, ...data[k] }));
        setEmployees(list);
      }
      // Data aane ke baad 1 second ka artificial delay taaki loader dikhe
      setTimeout(() => setLoading(false), 1000);
    });

    return () => unsubscribe();
  }, [db, isBoss]);

  // 2. 🛡️ Privacy Auto-Select: Worker ko seedha uska data dikhao
  useEffect(() => {
    if (!isBoss && user) {
      const self = { 
        id: user.firebaseId || user.employeeId, 
        ...user 
      };
      viewLedger(self);
    }
  }, [isBoss, user]);

  // 3. Ledger Details Load Function
  const viewLedger = (emp) => {
    setFetchingDetail(true); // Detail loading shuru
    setSelectedEmp(emp);
    
    // Payments History fetch
    const payRef = ref(db, `salaryPayments/${emp.id}`);
    onValue(payRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.keys(data).map(k => ({ id: k, ...data[k] })).reverse() : [];
      setPaymentHistory(list);
      
      // Detail loader delay
      setTimeout(() => setFetchingDetail(false), 600);
    });

    // Attendance Calculation logic
    const currentMonthPrefix = new Date().toISOString().slice(0, 7); 
    const attRef = ref(db, `attendance`);
    onValue(attRef, (snapshot) => {
      const allAttendance = snapshot.val();
      let p = 0, a = 0;
      let empHistory = {};

      if (allAttendance) {
        Object.keys(allAttendance).forEach(dateKey => {
          const dayData = allAttendance[dateKey];
          if (dayData && dayData[emp.id]) {
            const status = dayData[emp.id].status;
            empHistory[dateKey] = status;

            if (dateKey.startsWith(currentMonthPrefix)) {
              if (status === "Present") p++;
              else if (status === "Absent") a++;
            }
          }
        });
      }
      setAttendanceStats({ present: p, absent: a });
      setFullAttendanceData(empHistory); 
    });
  };

  // Calendar styling
  const getTileClassName = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = date.toLocaleDateString('en-CA'); 
      if (fullAttendanceData[dateStr] === "Present") return 'cal-present';
      if (fullAttendanceData[dateStr] === "Absent") return 'cal-absent';
    }
    return null;
  };

  // Financial Calculations
  const totalAdvance = paymentHistory.reduce((sum, p) => sum + Number(p.amount), 0);
  const perDaySalary = selectedEmp ? (Number(selectedEmp.salary) / 30) : 0;
  const earnedSalary = Math.round(perDaySalary * attendanceStats.present);

  // Advance Payment Submit
  const handlePayment = async (e) => {
    e.preventDefault();
    if (!isAuthorized) {
      alert("Aapko entries karne ki permission nahi hai!");
      return;
    }
    if(!advanceAmount || !selectedEmp) return;

    try {
      const payRef = ref(db, `salaryPayments/${selectedEmp.id}`);
      await push(payRef, {
          amount: advanceAmount,
          date: new Date().toISOString().split('T')[0],
          type: 'Advance'
      });
      setAdvanceAmount('');
      alert("✅ Advance Payment Added!");
    } catch (err) {
      alert("Error saving: " + err.message);
    }
  };

  // ======================================================
  // RENDER LOGIC
  // ======================================================

  if (loading) return <Loader />;

  return (
    <div className="table-container-wide">
      <div className="table-card-wide">
        <h2 className="table-title">
            {isBoss ? "Staff Salary & Attendance Ledger" : "My Payroll Ledger"}
        </h2>
        
        <div className="ledger-main-wrapper">
          {/* Sidebar Section: Privacy Protected */}
          {isBoss && (
            <div className="ledger-staff-list">
              <div className="scrollable-box">
                {employees.map(emp => (
                  <div 
                    key={emp.id} 
                    className={`staff-card-item ${selectedEmp?.id === emp.id ? 'active-ledger' : ''}`} 
                    onClick={() => viewLedger(emp)}
                  >
                    <div className="staff-info-mini">
                        <strong>{emp.name}</strong>
                        <div className="masked-id-text">
                            ID: {maskID(emp.employeeId)}
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Details Section */}
          {selectedEmp && (
            <div className={`ledger-detail-view ${!isBoss ? 'full-width-ledger' : ''}`}>
              
              {fetchingDetail ? (
                <div className="detail-fetch-loader">
                   <Loader />
                   <p>Fetching Secure Data...</p>
                </div>
              ) : (
                <>
                  <div className="attendance-summary-bar" onClick={() => setShowCalendar(true)}>
                    <div className="summary-item">Month: <b>{new Date().toLocaleString('default', { month: 'long' })}</b></div>
                    <div className="summary-item green">Present: <b>{attendanceStats.present} Days</b></div>
                    <div className="summary-item red">Absent: <b>{attendanceStats.absent} Days</b></div>
                    <div className="view-btn-small">👁️ History</div>
                  </div>

                  <div className="ledger-stats-row">
                    <div className="stat-pill total-salary">Salary <b>₹{selectedEmp.salary}</b></div>
                    <div className="stat-pill balance-due">Earned <b>₹{earnedSalary}</b></div>
                    <div className="stat-pill total-advance">Advance <b>₹{totalAdvance}</b></div>
                    <div className="stat-pill final-pay">Payable <b>₹{earnedSalary - totalAdvance}</b></div>
                  </div>

                  {/* Advance Entry: Sirf Admin/Accountant ke liye */}
                  {isAuthorized && (
                    <div className="advance-entry-box">
                       <form onSubmit={handlePayment} className="advance-form-grid">
                          <input 
                            type="number" 
                            placeholder="Enter Amount" 
                            value={advanceAmount} 
                            onChange={(e)=>setAdvanceAmount(e.target.value)} 
                            required
                          />
                          <button type="submit" className="save-btn-new">SAVE</button>
                       </form>
                    </div>
                  )}

                  <div className="ledger-table-container">
                    <table className="modern-sales-table">
                      <thead>
                        <tr>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentHistory.length > 0 ? (
                          paymentHistory.map(pay => (
                            <tr key={pay.id}>
                                <td>{pay.date}</td>
                                <td>{pay.type}</td>
                                <td className="amount-text-red">₹{pay.amount}</td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="3" className="no-data-msg">No payment history found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CALENDAR MODAL */}
      {showCalendar && (
        <div className="cal-modal-overlay">
          <div className="cal-modal-content">
            <div className="cal-modal-header">
              <h3>Attendance: {selectedEmp.name}</h3>
              <button className="cal-close-btn" onClick={() => setShowCalendar(false)}>&times;</button>
            </div>
            <div className="cal-body">
              <Calendar tileClassName={getTileClassName} />
              <div className="cal-legend">
                <div className="leg-item"><span className="leg-box green"></span> P</div>
                <div className="leg-item"><span className="leg-box red"></span> A</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeLedger;