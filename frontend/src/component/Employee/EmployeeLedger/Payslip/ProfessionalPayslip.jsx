import React from 'react';
import { QRCodeSVG } from 'qrcode.react'; // QR Code ke liye
import './ProfessionalPayslip.css';
const ProfessionalPayslip = ({ selectedEmp, stats, payroll }) => {
  if (!selectedEmp) return null;

  // QR Code Data: Scanning this shows key info
  const qrData = `
    Staff: ${selectedEmp.name}
    Month: ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
    Net Pay: ₹${payroll.netPayable.toLocaleString()}
    Status: Verified by Dhara Shakti Agro
  `.trim();

  return (
    <div className="payslip-wrapper only-print">
      {/* --- Header Section --- */}
      <div className="payslip-header-modern">
        <div className="company-branding">
          <h1>DHARA SHAKTI AGRO PRODUCTS</h1>
          <p className="address-line">Industrial Area, Patna, Bihar | +91 9123456789</p>
          <h2 className="payslip-title">PAY ADVICE - {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
        </div>
        <div className="qr-box">
          <QRCodeSVG value={qrData} size={80} level="H" />
          <p>Verified Secure</p>
        </div>
      </div>

      {/* --- Staff Meta Data --- */}
      <div className="payslip-staff-info">
        <div className="info-col">
          <p><b>Employee Name:</b> {selectedEmp.name}</p>
          <p><b>Designation:</b> {selectedEmp.designation}</p>
          <p><b>Employee ID:</b> {selectedEmp.employeeId || 'DSA-STF-001'}</p>
        </div>
        <div className="info-col">
          <p><b>Aadhar No:</b> {selectedEmp.aadhar}</p>
          <p><b>Bank A/C:</b> {selectedEmp.accountNo || 'XXXXXXXXXXXX'}</p>
          <p><b>Days Worked:</b> {stats.effectiveDaysWorked} Days</p>
        </div>
      </div>

      {/* --- Financial Table --- */}
      <table className="payslip-table-modern">
        <thead>
          <tr>
            <th>Earnings Components</th>
            <th>Amount (₹)</th>
            <th>Deductions</th>
            <th>Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Basic Salary (Earned)</td>
            <td>{payroll.grossEarned.toLocaleString()}</td>
            <td>PF (Provident Fund)</td>
            <td>{payroll.pfDeduction.toLocaleString()}</td>
          </tr>
          <tr>
            <td>Incentives & Bonus</td>
            <td>{(Number(payroll.incentive) || 0).toLocaleString()}</td>
            <td>ESI (Medical Insurance)</td>
            <td>{payroll.esiDeduction.toLocaleString()}</td>
          </tr>
          <tr>
            <td>Overtime Pay ({payroll.overtimeHours || 0} Hrs)</td>
            <td>{Math.round(payroll.otEarning).toLocaleString()}</td>
            <td>Advances / Loan Adjust.</td>
            <td>{payroll.totalAdvance.toLocaleString()}</td>
          </tr>
          <tr className="payslip-total-row">
            <td><b>Gross Earnings</b></td>
            <td><b>₹{payroll.totalEarnings.toLocaleString()}</b></td>
            <td><b>Total Deductions</b></td>
            <td><b>₹{payroll.totalDeductions.toLocaleString()}</b></td>
          </tr>
        </tbody>
      </table>

      {/* --- Footer Summary --- */}
      <div className="payslip-footer-summary">
        <div className="net-pay-section">
          <h3>NET TAKE-HOME: ₹{payroll.netPayable.toLocaleString()}</h3>
          <p className="words">Amount in words: Rupee {payroll.netPayable.toLocaleString()} Only</p>
        </div>
        <div className="signatures">
          <div className="sig-block">
            <div className="sig-line"></div>
            <p>Employee Signature</p>
          </div>
          <div className="sig-block">
            <div className="sig-line"></div>
            <p>Authorized Signatory</p>
          </div>
        </div>
      </div>
      <p className="disclaimer">This is a computer-generated document and does not require a physical stamp.</p>
    </div>
  );
};

export default ProfessionalPayslip;