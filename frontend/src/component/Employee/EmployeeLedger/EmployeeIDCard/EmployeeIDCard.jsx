import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './EmployeeIDCard.css';

const EmployeeIDCard = ({ selectedEmp }) => {
  if (!selectedEmp) return null;

  const qrData = `ID: ${selectedEmp.employeeId} | Name: ${selectedEmp.name} | Blood: ${selectedEmp.bloodGroup || 'N/A'}`;

  // 🖨️ Handle Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="id-card-generator-container">
      {/* 1️⃣ Print Button (Sirf Screen par dikhega) */}
      <div className="no-print print-btn-wrapper" style={{ textAlign: 'center', marginBottom: '20px' }}>
        <button className="view-btn-small id-print-btn" onClick={handlePrint} style={{ background: '#4d47f3', padding: '10px 20px', color: 'white', borderRadius: '8px', cursor: 'pointer', border: 'none' }}>
          🖨️ Print Employee ID Card
        </button>
      </div>

      {/* 2️⃣ ID Card Visualizer (Strict ID for Printing) */}
      <div id="printableIDCard" className="id-card-visualizer">
        {/* --- FRONT SIDE --- */}
        <div className="id-card front">
          <div className="card-header">
            <div className="company-logo-text">DHARA SHAKTI</div>
            <div className="agro-text">AGRO PRODUCTS</div>
          </div>
          
          <div className="photo-container">
            <img 
              src={selectedEmp.profilePic || "https://via.placeholder.com/100"} 
              alt="Profile" 
            />
          </div>

          <div className="emp-details">
            <h2 className="emp-name">{selectedEmp.name}</h2>
            <p className="emp-role">{selectedEmp.designation || selectedEmp.role}</p>
            <div className="id-pill">ID: {selectedEmp.employeeId || 'DSA-001'}</div>
          </div>

          <div className="card-footer-strip">EMPLOYEE ID CARD</div>
        </div>

        {/* --- BACK SIDE --- */}
        <div className="id-card back">
          <div className="back-content">
            <div className="back-row">
              <strong>DOB:</strong> <span>{selectedEmp.dob || '01-01-1990'}</span>
            </div>
            <div className="back-row">
              <strong>Blood Group:</strong> <span className="red-text">{selectedEmp.bloodGroup || 'B+'}</span>
            </div>
            <div className="back-row">
              <strong>Phone:</strong> <span>{selectedEmp.phone || '+91 0000000000'}</span>
            </div>
            <div className="address-section">
              <strong>Office Address:</strong>
              <p>Sri Pur Gahar, Samastipur, Bihar 848117</p>
            </div>
            
            <div className="qr-container-id">
              <QRCodeSVG value={qrData} size={60} level="H" />
              <p className="scan-text">Scan for Verification</p>
            </div>
          </div>
          <div className="card-footer-strip dark">www.dharashaktiagro.com</div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeIDCard;