import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue, push } from "firebase/database";
import { app } from "../../../redux/api/firebase/firebase";
import Calendar from 'react-calendar'; 
import 'react-calendar/dist/Calendar.css'; 
import './EmployeeLedger.css';

// 👈 role prop add kiya gaya hai
const EmployeeLedger = ({ role }) => {
  const db = getDatabase(app);
  
  // 🔐 Permission Check: Sirf Admin aur Accountant hi payments add kar sakte hain
  const isAuthorized = role === "Admin" || role === "Accountant";

  const [employees, setEmployees] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, absent: 0 });
  const [advanceAmount, setAdvanceAmount] = useState('');
  
  const [showCalendar, setShowCalendar] = useState(false);
  const [fullAttendanceData, setFullAttendanceData] = useState({});

  useEffect(() => {
    onValue(ref(db, "employees"), (snapshot) => {
      const data = snapshot.val();
      if (data) setEmployees(Object.keys(data).map(k => ({ id: k, ...data[k] })));
    });
  }, [db]);

  const viewLedger = (emp) => {
    setSelectedEmp(emp);
    
    // Payments Load
    onValue(ref(db, `salaryPayments/${emp.id}`), (snapshot) => {
      const data = snapshot.val();
      setPaymentHistory(data ? Object.keys(data).map(k => ({ id: k, ...data[k] })).reverse() : []);
    });

    // Attendance Logic
    const currentMonthPrefix = new Date().toISOString().slice(0, 7); 
    onValue(ref(db, `attendance`), (snapshot) => {
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

  const getTileClassName = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = date.toLocaleDateString('en-CA'); 
      if (fullAttendanceData[dateStr] === "Present") return 'cal-present';
      if (fullAttendanceData[dateStr] === "Absent") return 'cal-absent';
    }
    return null;
  };

  const totalAdvance = paymentHistory.reduce((sum, p) => sum + Number(p.amount), 0);
  const perDaySalary = selectedEmp ? (Number(selectedEmp.salary) / 30) : 0;
  const earnedSalary = Math.round(perDaySalary * attendanceStats.present);

  const handlePayment = async (e) => {
    e.preventDefault();

    // 🛑 Security Guard
    if (!isAuthorized) {
      alert("Unauthorized: Aapko payment add karne ki permission nahi hai.");
      return;
    }

    if(!advanceAmount || !selectedEmp) return;
    const payRef = ref(db, `salaryPayments/${selectedEmp.id}`);
    await push(payRef, {
        amount: advanceAmount,
        date: new Date().toISOString().split('T')[0],
        type: 'Advance'
    });
    setAdvanceAmount('');
    alert("Payment Added!");
  };

  return (
    <div className="table-container-wide">
      <div className="table-card-wide">
        <h2 className="table-title">Staff Salary & Attendance Ledger</h2>
        
        <div className="ledger-main-wrapper">
          <div className="ledger-staff-list">
            <div className="scrollable-box">
              {employees.map(emp => (
                <div key={emp.id} className={`staff-card-item ${selectedEmp?.id === emp.id ? 'active-ledger' : ''}`} onClick={() => viewLedger(emp)}>
                  <strong>{emp.name}</strong>
                  <div style={{fontSize: '11px', color: '#666'}}>ID: {emp.employeeId}</div>
                </div>
              ))}
            </div>
          </div>

          {selectedEmp && (
            <div className="ledger-detail-view">
              <div className="attendance-summary-bar" onClick={() => setShowCalendar(true)} title="Click to view Full Calendar">
                <div className="summary-item">Month: <b>{new Date().toLocaleString('default', { month: 'long' })}</b></div>
                <div className="summary-item green">Present: <b>{attendanceStats.present} Days</b></div>
                <div className="summary-item red">Absent: <b>{attendanceStats.absent} Days</b></div>
                <div className="view-btn-small">👁️ View History</div>
              </div>

              <div className="ledger-stats-row">
                <div className="stat-pill total-salary">Full Month Salary <b>₹{selectedEmp.salary}</b></div>
                <div className="stat-pill balance-due">Earned ({attendanceStats.present} d) <b>₹{earnedSalary}</b></div>
                <div className="stat-pill total-advance">Advance Taken <b>₹{totalAdvance}</b></div>
                <div className="stat-pill final-pay">Net Payable <b>₹{earnedSalary - totalAdvance}</b></div>
              </div>

              {/* 🔐 Advance Entry Section Protected */}
              <div className={`advance-entry-box ${!isAuthorized ? 'locked-box' : ''}`}>
                 <form onSubmit={handlePayment} className="advance-form-grid">
                    <input 
                      type="number" 
                      placeholder={isAuthorized ? "Enter Payment Amount" : "🔒 Access Restricted"} 
                      value={advanceAmount} 
                      onChange={(e)=>setAdvanceAmount(e.target.value)} 
                      disabled={!isAuthorized}
                      readOnly={!isAuthorized}
                    />
                    <button 
                      type="submit" 
                      className="save-btn-new"
                      disabled={!isAuthorized}
                      style={{ 
                        opacity: isAuthorized ? 1 : 0.6,
                        cursor: isAuthorized ? 'pointer' : 'not-allowed'
                      }}
                    >
                      {isAuthorized ? "ADD ENTRY" : "🔒 Locked"}
                    </button>
                 </form>
                 {!isAuthorized && <p style={{fontSize: '11px', color: 'red', marginTop: '5px'}}>* Sirf Admin aur Accountant hi payment entry kar sakte hain.</p>}
              </div>

              <div className="ledger-table-container">
                <table className="modern-sales-table">
                  <thead><tr><th>Date</th><th>Type</th><th>Amount</th></tr></thead>
                  <tbody>
                    {paymentHistory.map(pay => (
                      <tr key={pay.id}><td>{pay.date}</td><td>{pay.type}</td><td className="amount-text-red">₹{pay.amount}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {showCalendar && (
        <div className="cal-modal-overlay">
          <div className="cal-modal-content">
            <div className="cal-modal-header">
              <h3>Attendance History: {selectedEmp.name}</h3>
              <button className="cal-close-btn" onClick={() => setShowCalendar(false)}>&times;</button>
            </div>
            <div className="cal-body">
              <Calendar tileClassName={getTileClassName} />
              <div className="cal-legend">
                <div className="leg-item"><span className="leg-box green"></span> Present</div>
                <div className="leg-item"><span className="leg-box red"></span> Absent</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeLedger;