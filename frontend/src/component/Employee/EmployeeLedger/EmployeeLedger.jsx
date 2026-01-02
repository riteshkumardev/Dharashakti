import React, { useState, useEffect } from 'react';
import axios from 'axios'; // 🛠️ Firebase ki jagah Axios
import Calendar from 'react-calendar'; 
import 'react-calendar/dist/Calendar.css'; 
import './EmployeeLedger.css';
import Loader from "../../Core_Component/Loader/Loader";

const EmployeeLedger = ({ role, user }) => {
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

  // 1️⃣ Fetch Staff List (Boss Only)
  useEffect(() => {
    const fetchEmployees = async () => {
      if (!isBoss) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get("http://localhost:5000/api/employees");
        if (res.data.success) setEmployees(res.data.data);
      } catch (err) { console.error("Staff load failed"); }
      finally { setLoading(false); }
    };
    fetchEmployees();
  }, [isBoss]);

  // 2️⃣ Auto-View for Self (Workers/Operators)
  useEffect(() => {
    if (!isBoss && user) {
      viewLedger(user);
    }
  }, [isBoss, user]);

  // 3️⃣ Fetch Detailed Ledger for Selected Employee
  const viewLedger = async (emp) => {
    setFetchingDetail(true);
    setSelectedEmp(emp);
    
    const empId = emp.employeeId || emp._id;

    try {
      // Fetch Payment History (Advance)
      const payRes = await axios.get(`http://localhost:5000/api/salary-payments/${empId}`);
      if (payRes.data.success) setPaymentHistory(payRes.data.data.reverse());

      // Fetch Attendance Data (Assuming you have an attendance API)
      const currentMonth = new Date().toISOString().slice(0, 7); 
      const attRes = await axios.get(`http://localhost:5000/api/attendance/report/${empId}`);
      
      if (attRes.data.success) {
        const history = attRes.data.data; // Expected format: { "2023-10-01": "Present", ... }
        let p = 0, a = 0;
        
        Object.keys(history).forEach(date => {
          if (date.startsWith(currentMonth)) {
            if (history[date] === "Present") p++;
            else if (history[date] === "Absent") a++;
          }
        });
        setAttendanceStats({ present: p, absent: a });
        setFullAttendanceData(history);
      }
    } catch (err) {
      console.error("Ledger detail fetch error");
    } finally {
      setFetchingDetail(false);
    }
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

  // 4️⃣ Handle Advance Payment (Save to MongoDB)
  const handlePayment = async (e) => {
    e.preventDefault();
    if (!isAuthorized) { alert("Permission denied!"); return; }
    if(!advanceAmount || !selectedEmp) return;

    try {
      const res = await axios.post("http://localhost:5000/api/salary-payments", {
        employeeId: selectedEmp.employeeId || selectedEmp._id,
        amount: advanceAmount,
        date: new Date().toISOString().split('T')[0],
        type: 'Advance'
      });

      if (res.data.success) {
        setAdvanceAmount('');
        alert("✅ Advance Added!");
        viewLedger(selectedEmp); // UI Refresh
      }
    } catch (err) { alert("Save failed: " + err.message); }
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
                  <div key={emp._id} className={`staff-card-item ${selectedEmp?._id === emp._id ? 'active-ledger' : ''}`} onClick={() => viewLedger(emp)}>
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
                            <tr key={pay._id}>
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

      {/* PRINT SECTION */}
      {selectedEmp && (
        <div className="printable-invoice A4 only-print">
            <div className="invoice-header">
                <div className="company-info-center">
                    <h1>DHARA SHAKTI AGRO PRODUCTS</h1>
                    <p className="manufacture-line">STAFF EARNING & ATTENDANCE LEDGER</p>
                    <p>Calculation: (Base Salary / 30 Days)</p>
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
        </div>
      )}
    </div>
  );
};

export default EmployeeLedger;