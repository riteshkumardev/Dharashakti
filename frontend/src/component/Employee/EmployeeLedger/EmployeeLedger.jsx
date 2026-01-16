import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios'; 
import Calendar from 'react-calendar'; 
import 'react-calendar/dist/Calendar.css'; 
import './EmployeeLedger.css';
import Loader from "../../Core_Component/Loader/Loader";
import ProfessionalPayslip from './Payslip/ProfessionalPayslip';

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
  
  // 🆕 Payslip Show/Hide State
  const [showPayslip, setShowPayslip] = useState(false);

  const [fullAttendanceData, setFullAttendanceData] = useState({});
  const [loading, setLoading] = useState(true); 
  const [fetchingDetail, setFetchingDetail] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const maskID = (id) => {
    if (!id) return "---";
    const strID = id.toString();
    return strID.length > 4 ? "XXXX" + strID.slice(-4) : strID;
  };

  const availableMonths = useMemo(() => {
    const now = new Date();
    const currentStr = now.toISOString().slice(0, 7); 
    if (!selectedEmp?.joiningDate) return [currentStr];
    const start = new Date(selectedEmp.joiningDate);
    const end = new Date();
    const months = [];
    if (isNaN(start.getTime())) return [currentStr];
    let tempDate = new Date(start.getFullYear(), start.getMonth(), 1);
    while (tempDate <= end) {
      months.push(tempDate.toISOString().slice(0, 7));
      tempDate.setMonth(tempDate.getMonth() + 1);
    }
    if (!months.includes(currentStr)) months.push(currentStr);
    return months.reverse(); 
  }, [selectedEmp]);

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

  const viewLedger = async (emp, month = selectedMonth) => {
    setFetchingDetail(true);
    setSelectedEmp(emp);
    const empId = emp.employeeId || emp._id;
    try {
      const payRes = await axios.get(`${API_URL}/api/salary-payments/${empId}`);
      if (payRes.data.success) {
        const filteredPay = payRes.data.data.filter(p => p.date.startsWith(month));
        setPaymentHistory(filteredPay.reverse());
      }
      const attRes = await axios.get(`${API_URL}/api/attendance/report/${empId}`);
      if (attRes.data.success) {
        const history = attRes.data.data; 
        let p = 0, a = 0, h = 0;
        Object.keys(history).forEach(date => {
          if (date.startsWith(month)) {
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

  useEffect(() => {
    if (selectedEmp) {
      viewLedger(selectedEmp, selectedMonth);
    }
  }, [selectedMonth]);

  const monthlySalary = selectedEmp ? Number(selectedEmp.salary) : 0;
  const dayRate = monthlySalary / 30;
  
  const stats = {
    effectiveDaysWorked: attendanceStats.present + (attendanceStats.halfDay * 0.5),
    present: attendanceStats.present, 
    absent: attendanceStats.absent, 
    halfDay: attendanceStats.halfDay
  };

  const grossEarned = Math.round(dayRate * stats.effectiveDaysWorked);
  const totalAdvance = paymentHistory.reduce((sum, p) => sum + Number(p.amount), 0);
  const otEarning = (Number(overtimeHours) || 0) * (dayRate / 8);
  const totalEarnings = Math.round(grossEarned + otEarning + (Number(incentive) || 0));
  const netPayable = totalEarnings - totalAdvance;

  const payroll = {
    grossEarned, totalAdvance, otEarning, totalEarnings,
    netPayable, incentive, overtimeHours, pfDeduction: 0, esiDeduction: 0, totalDeductions: totalAdvance
  };

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
        viewLedger(selectedEmp, selectedMonth);
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
              
              <div className="month-selector-pro" style={{
                  display: 'flex', alignItems: 'center', gap: '15px', 
                  background: '#f8fafc', padding: '12px 20px', borderRadius: '12px', border: '1px solid #e2e8f0'
              }}>
                <label style={{fontWeight: '800', color: '#1e293b', fontSize: '13px'}}>SALARY PERIOD:</label>
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  style={{padding: '6px 15px', borderRadius: '8px', border: '2px solid #4d47f3', fontWeight: '700', cursor: 'pointer', color: '#000'}}
                >
                  {availableMonths.map(m => (
                    <option key={m} value={m}>
                      {new Date(m + "-01").toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </option>
                  ))}
                </select>
              </div>

              <div className="attendance-summary-bar">
                <div className="summary-item">Days: <b>{stats.effectiveDaysWorked}</b></div>
                <div className="summary-item green">P: <b>{stats.present}</b></div>
                <div className="summary-item yellow">H/D: <b>{stats.halfDay}</b></div>
                <div className="summary-item red">A: <b>{stats.absent}</b></div>
                <button className="view-btn-small" onClick={() => setShowCalendar(true)}>🗓️ History</button>
                
                {/* ✅ Button updated to toggle Payslip view instead of printing */}
                <button 
                  className="view-btn-small print-btn" 
                  onClick={() => setShowPayslip(!showPayslip)}
                >
                  {showPayslip ? "❌ Close Payslip" : "📄 View Payslip"}
                </button>
              </div>

              <div className="pro-payroll-grid">
                <div className="pro-card earnings-card">
                  <h4 className="card-header-text">💰 Earnings ({new Date(selectedMonth + "-01").toLocaleString('default', { month: 'short' })})</h4>
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
                  <h4 className="card-header-text">📉 Deductions</h4>
                  <div className="pay-row highlight"><span>Advances Taken:</span> <b className="text-red">- ₹{totalAdvance.toLocaleString()}</b></div>
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
              <Calendar 
                activeStartDate={new Date(selectedMonth + "-01")}
                tileClassName={getTileClassName} 
              />
              <div className="cal-legend">
                <div className="leg-item"><span className="leg-box green"></span> P</div>
                <div className="leg-item"><span className="leg-box yellow"></span> H/D</div>
                <div className="leg-item"><span className="leg-box red"></span> A</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Payslip Component with toggle visibility */}
      {selectedEmp && showPayslip && (
        <ProfessionalPayslip 
          selectedEmp={selectedEmp}
          stats={stats}
          payroll={payroll}
          currentMonth={selectedMonth}
        />
      )}
    </div>
  );
};

export default EmployeeLedger;