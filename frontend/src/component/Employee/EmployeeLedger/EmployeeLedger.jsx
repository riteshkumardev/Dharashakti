import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue, push } from "firebase/database";
import { app } from "../../../redux/api/firebase/firebase";
import Calendar from 'react-calendar'; 
import 'react-calendar/dist/Calendar.css'; 
import './EmployeeLedger.css';
import Loader from "../../Core_Component/Loader/Loader";

const EmployeeLedger = ({ role, user }) => {
  const db = getDatabase(app);
  
  const isAuthorized = role === "Admin" || role === "Accountant";
  const isBoss = role === "Admin" || role === "Manager";

  const [employees, setEmployees] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, absent: 0 });
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [fullAttendanceData, setFullAttendanceData] = useState({});
  const [loading, setLoading] = useState(true); 
  const [fetchingDetail, setFetchingDetail] = useState(false);

  const maskID = (id) => {
    if (!id) return "---";
    const strID = id.toString();
    return strID.length > 4 ? "XXXX" + strID.slice(-4) : strID;
  };

  useEffect(() => {
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
      setTimeout(() => setLoading(false), 1000);
    });
    return () => unsubscribe();
  }, [db, isBoss]);

  useEffect(() => {
    if (!isBoss && user) {
      const self = { id: user.firebaseId || user.employeeId, ...user };
      viewLedger(self);
    }
  }, [isBoss, user]);

  const viewLedger = (emp) => {
    setFetchingDetail(true);
    setSelectedEmp(emp);
    
    const payRef = ref(db, `salaryPayments/${emp.id}`);
    onValue(payRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.keys(data).map(k => ({ id: k, ...data[k] })).reverse() : [];
      setPaymentHistory(list);
      setTimeout(() => setFetchingDetail(false), 600);
    });

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
  const monthlySalary = selectedEmp ? Number(selectedEmp.salary) : 0;
  const earnedSalary = Math.round((monthlySalary / 30) * attendanceStats.present);
  const netPayable = earnedSalary - totalAdvance;

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!isAuthorized) { alert("Permission denied!"); return; }
    if(!advanceAmount || !selectedEmp) return;
    try {
      const payRef = ref(db, `salaryPayments/${selectedEmp.id}`);
      await push(payRef, {
          amount: advanceAmount,
          date: new Date().toISOString().split('T')[0],
          type: 'Advance'
      });
      setAdvanceAmount('');
      alert("✅ Advance Added!");
    } catch (err) { alert("Error: " + err.message); }
  };

  if (loading) return <Loader />;

  return (
    <div className="table-container-wide">
      <div className="table-card-wide no-print">
        <h2 className="table-title">
            {isBoss ? "Staff Salary & Attendance Ledger" : "My Payroll Ledger"}
        </h2>
        
        <div className="ledger-main-wrapper">
          {isBoss && (
            <div className="ledger-staff-list">
              <div className="scrollable-box">
                {employees.map(emp => (
                  <div key={emp.id} className={`staff-card-item ${selectedEmp?.id === emp.id ? 'active-ledger' : ''}`} onClick={() => viewLedger(emp)}>
                    <div className="staff-info-mini">
                        <strong>{emp.name}</strong>
                        <div className="masked-id-text">ID: {maskID(emp.employeeId)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedEmp && (
            <div className={`ledger-detail-view ${!isBoss ? 'full-width-ledger' : ''}`}>
              {fetchingDetail ? (
                <div className="detail-fetch-loader"><Loader /><p>Fetching Secure Data...</p></div>
              ) : (
                <>
                  <div className="attendance-summary-bar">
                    <div className="summary-item">Month: <b>{new Date().toLocaleString('default', { month: 'long' })}</b></div>
                    <div className="summary-item green">Present: <b>{attendanceStats.present} Days</b></div>
                    <div className="summary-item red">Absent: <b>{attendanceStats.absent} Days</b></div>
                    <button className="view-btn-small" onClick={() => setShowCalendar(true)}>👁️ History</button>
                    <button className="view-btn-small" style={{background: '#2e7d32', color: 'white'}} onClick={() => window.print()}>🖨️ Print Ledger</button>
                  </div>

                  <div className="ledger-stats-row">
                    <div className="stat-pill total-salary">Salary <b>₹{monthlySalary}</b></div>
                    <div className="stat-pill balance-due">Earned <b>₹{earnedSalary}</b></div>
                    <div className="stat-pill total-advance">Advance <b>₹{totalAdvance}</b></div>
                    <div className="stat-pill final-pay">Payable <b>₹{netPayable}</b></div>
                  </div>

                  {isAuthorized && (
                    <div className="advance-entry-box">
                       <form onSubmit={handlePayment} className="advance-form-grid">
                          <input type="number" placeholder="Enter Amount" value={advanceAmount} onChange={(e)=>setAdvanceAmount(e.target.value)} required />
                          <button type="submit" className="save-btn-new">SAVE</button>
                       </form>
                    </div>
                  )}

                  <div className="ledger-table-container">
                    <table className="modern-sales-table">
                      <thead><tr><th>Date</th><th>Type</th><th>Amount</th></tr></thead>
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

      {/* --- HIDDEN PRINT SECTION --- */}
     
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
       {selectedEmp && (
        <div className="printable-invoice A4 only-print">
            <div className="invoice-header">
                <div className="company-info-center">
                    <h1>DHARA SHAKTI AGRO PRODUCTS</h1>
                    <p className="manufacture-line">STAFF EARNING & ATTENDANCE LEDGER</p>
                    <p>GSTIN : 10DZTPM1457E1ZE | Calculation: (Base Salary / 30 Days)</p>
                </div>
            </div>

            <table className="modern-report-table">
                <thead>
                    <tr>
                        <th>Staff Name</th>
                        <th>Monthly Salary</th>
                        <th>Days Worked</th>
                        <th>Earned Amount</th>
                        <th>Advance Paid</th>
                        <th>Net Payable</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>{selectedEmp.name}</strong></td>
                        <td>₹{monthlySalary.toLocaleString()}</td>
                        <td>{attendanceStats.present} Days</td>
                        <td>₹{earnedSalary.toLocaleString()}</td>
                        <td style={{color: 'red'}}>- ₹{totalAdvance.toLocaleString()}</td>
                        <td style={{fontWeight: 'bold', color: 'green', backgroundColor: '#f9f9f9'}}>
                            ₹{netPayable.toLocaleString()}
                        </td>
                    </tr>
                </tbody>
            </table>
            
            <div className="print-footer" style={{marginTop: '40px', display: 'flex', justifyContent: 'space-between'}}>
                <div style={{borderTop: '1px solid black', width: '200px', textAlign: 'center'}}>Manager Signature</div>
                <div style={{borderTop: '1px solid black', width: '200px', textAlign: 'center'}}>Employee Signature</div>
            </div>
        </div>
      )}

    </div>
  );
};

export default EmployeeLedger;