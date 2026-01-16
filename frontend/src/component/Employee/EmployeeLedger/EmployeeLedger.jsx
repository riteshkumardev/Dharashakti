import React, { useState, useEffect } from 'react';
import axios from 'axios'; 
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
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, absent: 0, halfDay: 0 });
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [overtimeHours, setOvertimeHours] = useState('');
  const [incentive, setIncentive] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [fullAttendanceData, setFullAttendanceData] = useState({});
  const [loading, setLoading] = useState(true); 
  const [fetchingDetail, setFetchingDetail] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const maskID = (id) => {
    if (!id) return "---";
    const strID = id.toString();
    return strID.length > 4 ? "XXXX" + strID.slice(-4) : strID;
  };

  // 1️⃣ Fetch Staff List (Boss Only)
  useEffect(() => {
    const fetchEmployees = async () => {
      if (!isBoss) { setLoading(false); return; }
      try {
        const res = await axios.get(`${API_URL}/api/employees`);
        if (res.data.success) setEmployees(res.data.data);
      } catch (err) { console.error("Staff load failed"); } 
      finally { setLoading(false); }
    };
    fetchEmployees();
  }, [isBoss, API_URL]);

  // 2️⃣ View Detailed Ledger
  const viewLedger = async (emp) => {
    setFetchingDetail(true);
    setSelectedEmp(emp);
    const empId = emp.employeeId || emp._id;

    try {
      const payRes = await axios.get(`${API_URL}/api/salary-payments/${empId}`);
      if (payRes.data.success) setPaymentHistory(payRes.data.data.reverse());

      const currentMonth = new Date().toISOString().slice(0, 7); 
      const attRes = await axios.get(`${API_URL}/api/attendance/report/${empId}`);
      
      if (attRes.data.success) {
        const history = attRes.data.data; 
        let p = 0, a = 0, h = 0;
        
        Object.keys(history).forEach(date => {
          if (date.startsWith(currentMonth)) {
            if (history[date] === "Present") p++;
            else if (history[date] === "Absent") a++;
            else if (history[date] === "Half-Day") h++;
          }
        });
        setAttendanceStats({ present: p, absent: a, halfDay: h });
        setFullAttendanceData(history);
      }
    } catch (err) { console.error("Fetch error"); } 
    finally { setFetchingDetail(false); }
  };

  // 🧮 Professional Payroll Calculations
  const monthlySalary = selectedEmp ? Number(selectedEmp.salary) : 0;
  const dayRate = monthlySalary / 30;
  const effectiveDaysWorked = attendanceStats.present + (attendanceStats.halfDay * 0.5);
  const grossEarned = Math.round(dayRate * effectiveDaysWorked);
  const pfDeduction = selectedEmp?.role === "Worker" ? 0 : Math.round(grossEarned * 0.12);
  const esiDeduction = Math.round(grossEarned * 0.0075);
  const totalAdvance = paymentHistory.reduce((sum, p) => sum + Number(p.amount), 0);
  const otEarning = (Number(overtimeHours) || 0) * (dayRate / 8);
  const totalEarnings = Math.round(grossEarned + otEarning + (Number(incentive) || 0));
  const totalDeductions = Math.round(pfDeduction + esiDeduction + totalAdvance);
  const netPayable = totalEarnings - totalDeductions;

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!isAuthorized || !advanceAmount) return;
    try {
      const res = await axios.post(`${API_URL}/api/salary-payments`, {
        employeeId: selectedEmp.employeeId || selectedEmp._id,
        amount: advanceAmount,
        date: new Date().toISOString().split('T')[0],
        type: 'Advance'
      });
      if (res.data.success) {
        setAdvanceAmount('');
        alert("✅ Payment Recorded!");
        viewLedger(selectedEmp);
      }
    } catch (err) { alert("Error saving payment"); }
  };

  const getTileClassName = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = date.toLocaleDateString('en-CA'); 
      if (fullAttendanceData[dateStr] === "Present") return 'cal-present';
      if (fullAttendanceData[dateStr] === "Absent") return 'cal-absent';
      if (fullAttendanceData[dateStr] === "Half-Day") return 'cal-half';
    }
    return null;
  };

  if (loading) return <Loader />;

  return (
    <div className="table-container-wide">
      <div className="table-card-wide no-print">
        <h2 className="table-title">Dhara Shakti Agro: Professional Payroll</h2>
        
        <div className="ledger-main-wrapper">
          {isBoss && (
            <div className="ledger-staff-list">
              <div className="scrollable-box">
                {employees.map(emp => (
                  <div key={emp._id} className={`staff-card-item ${selectedEmp?._id === emp._id ? 'active-ledger' : ''}`} onClick={() => viewLedger(emp)}>
                    <div className="staff-info-mini">
                        <strong>{emp.name}</strong>
                        <div className="designation-text">{emp.designation || emp.role} | ID: {maskID(emp.employeeId)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedEmp && (
            <div className="ledger-detail-view full-width-ledger">
              <div className="attendance-summary-bar">
                <div className="summary-item">Days: <b>{effectiveDaysWorked}</b></div>
                <div className="summary-item green">P: <b>{attendanceStats.present}</b></div>
                <div className="summary-item yellow">H/D: <b>{attendanceStats.halfDay}</b></div>
                <div className="summary-item red">A: <b>{attendanceStats.absent}</b></div>
                <button className="view-btn-small" onClick={() => setShowCalendar(true)}>🗓️ History</button>
                <button className="view-btn-small print-btn" onClick={() => window.print()}>🖨️ Payslip</button>
              </div>

              <div className="pro-payroll-grid">
                <div className="pro-card earnings-card">
                  <h4 className="card-header-text">💰 Earning Components</h4>
                  <div className="pay-row"><span>Base Salary:</span> <b>₹{monthlySalary.toLocaleString()}</b></div>
                  <div className="pay-row"><span>Gross Earned:</span> <b className="text-green">₹{grossEarned.toLocaleString()}</b></div>
                  <div className="pay-input-group">
                    <div className="pro-input-field">
                      <label>Incentive/Bonus</label>
                      <input type="number" value={incentive} onChange={(e)=>setIncentive(e.target.value)} placeholder="₹" />
                    </div>
                    <div className="pro-input-field">
                      <label>Overtime (Hrs)</label>
                      <input type="number" value={overtimeHours} onChange={(e)=>setOvertimeHours(e.target.value)} placeholder="Hrs" />
                    </div>
                  </div>
                </div>

                <div className="pro-card deductions-card">
                  <h4 className="card-header-text">📉 Statutory Deductions</h4>
                  <div className="pay-row"><span>PF (12%):</span> <b className="text-red">- ₹{pfDeduction.toLocaleString()}</b></div>
                  <div className="pay-row"><span>ESI (0.75%):</span> <b className="text-red">- ₹{esiDeduction.toLocaleString()}</b></div>
                  <div className="pay-row highlight"><span>Total Advance:</span> <b className="text-red">- ₹{totalAdvance.toLocaleString()}</b></div>
                  
                  <div className="net-payable-box">
                    <div className="net-label">NET TAKE-HOME</div>
                    <div className="net-amount">₹{netPayable.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {isAuthorized && (
                <form onSubmit={handlePayment} className="pro-action-bar">
                  <input type="number" placeholder="Enter Advance Amount..." value={advanceAmount} onChange={(e)=>setAdvanceAmount(e.target.value)} />
                  <button type="submit">RECORD DISBURSEMENT</button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

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
                <div className="leg-item"><span className="leg-box yellow"></span> H/D</div>
                <div className="leg-item"><span className="leg-box red"></span> A</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedEmp && (
        <div className="payslip-print-view only-print">
            <div className="payslip-header">
                <h1>DHARA SHAKTI AGRO PRODUCTS</h1>
                <h3>Salary Slip - {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
            </div>
            <div className="payslip-meta">
                <p><b>Name:</b> {selectedEmp.name} | <b>Designation:</b> {selectedEmp.designation}</p>
                <p><b>Aadhar:</b> {selectedEmp.aadhar} | <b>Account:</b> {selectedEmp.accountNo || 'N/A'}</p>
            </div>
            <table className="payslip-table">
                <thead><tr><th>Earnings</th><th>Amount</th><th>Deductions</th><th>Amount</th></tr></thead>
                <tbody>
                    <tr><td>Basic Salary</td><td>₹{grossEarned}</td><td>PF (Provident Fund)</td><td>₹{pfDeduction}</td></tr>
                    <tr><td>Incentives</td><td>₹{incentive || 0}</td><td>ESI</td><td>₹{esiDeduction}</td></tr>
                    <tr><td>OT Pay ({overtimeHours || 0} Hrs)</td><td>₹{Math.round(otEarning)}</td><td>Advances Taken</td><td>₹{totalAdvance}</td></tr>
                    <tr className="payslip-total-row"><td><b>Total Earnings</b></td><td><b>₹{totalEarnings}</b></td><td><b>Total Deductions</b></td><td><b>₹{totalDeductions}</b></td></tr>
                </tbody>
            </table>
            <div className="net-salary-box">
                NET PAYABLE: ₹{netPayable.toLocaleString()}
                <p><small>(In words: Rupee {netPayable} Only)</small></p>
            </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeLedger;