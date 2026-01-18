import React, { useState } from 'react';
import './Emp.css';
import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

const EmployeeAdd = ({ onEntrySaved }) => {
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const [formData, setFormData] = useState({
    name: "", fatherName: "", phone: "", emergencyPhone: "",
    aadhar: "", address: "", designation: "Worker",
    joiningDate: new Date().toISOString().split("T")[0],
    salary: "", bankName: "", accountNo: "", ifscCode: "",
    photo: "", password: ""
  });

  const showMsg = (msg, type = "success") => {
    setSnackbar({ open: true, message: msg, severity: type });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setFormData({ ...formData, photo: reader.result });
    reader.readAsDataURL(file);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // --- Validation Logic ---
    // मोबाइल नंबर 10 अंक से ज्यादा न हो
    if ((name === "phone" || name === "emergencyPhone") && value.length > 10) return;
    
    // आधार नंबर 12 अंक से ज्यादा न हो
    if (name === "aadhar" && value.length > 12) return;

    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Final check for length before submission
    if (formData.phone.length !== 10) {
      showMsg("Mobile number 10 digits ka hona chahiye!", "error");
      return;
    }
    if (formData.aadhar.length !== 12) {
      showMsg("Aadhar number 12 digits ka hona chahiye!", "error");
      return;
    }

    setLoading(true);
    try {
      const dataToSubmit = { 
        ...formData, 
        salary: Number(formData.salary),
        role: formData.designation 
      };

      const res = await fetch(`${API_URL}/api/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSubmit),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Registration fail ho gaya!");
      }

      showMsg(`🎉 Employee Registered! ID: ${data.employeeId}`, "success");
      
      if (onEntrySaved) onEntrySaved();

      setFormData({
        name: "", fatherName: "", phone: "", emergencyPhone: "",
        aadhar: "", address: "", designation: "Worker",
        joiningDate: new Date().toISOString().split("T")[0],
        salary: "", bankName: "", accountNo: "", ifscCode: "",
        photo: "", password: ""
      });

    } catch (err) {
      showMsg(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '15px',
    marginBottom: '20px'
  };

  return (
    <div className="table-card-wide modern-form-container">
      {loading && <Loader />}
      
      <div className="form-header-main">
        <h2 className="table-title">Staff Enrollment Portal</h2>
        <p className="subtitle">Digital Identity & Payroll Setup</p>
      </div>

      <form onSubmit={handleSubmit} className="employee-form-structured">
        
        <h3 className="form-section-title">👤 Personal Information</h3>
        <div style={gridStyle}>
          <div className="input-group">
            <label>Full Name *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label>Father's Name</label>
            <input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} />
          </div>
          <div className="input-group">
            <label>Aadhar Number * (12 Digits)</label>
            <input 
              type="number" 
              name="aadhar" 
              value={formData.aadhar} 
              onChange={handleChange} 
              onInput={(e) => e.target.value = e.target.value.slice(0, 12)}
              required 
            />
          </div>
          <div className="input-group">
            <label>Contact Number * (10 Digits)</label>
            <input 
              type="number" 
              name="phone" 
              value={formData.phone} 
              onChange={handleChange} 
              onInput={(e) => e.target.value = e.target.value.slice(0, 10)}
              required 
            />
          </div>
          <div className="input-group">
            <label>Emergency Contact</label>
            <input 
              type="number" 
              name="emergencyPhone" 
              value={formData.emergencyPhone} 
              onChange={handleChange} 
              onInput={(e) => e.target.value = e.target.value.slice(0, 10)}
            />
          </div>
          <div className="input-group">
            <label>Profile Photo</label>
            <input type="file" accept="image/*" onChange={handlePhotoChange} />
          </div>
        </div>

        <h3 className="form-section-title">💼 Employment & Security</h3>
        <div style={gridStyle}>
          <div className="input-group">
            <label>Designation</label>
            <select name="designation" value={formData.designation} onChange={handleChange}>
              <option value="Manager">Manager</option>
              <option value="Operator">Operator</option>
              <option value="Worker">Worker</option>
              <option value="Driver">Driver</option>
              <option value="Helper">Helper</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <div className="input-group">
            <label>Joining Date</label>
            <input type="date" name="joiningDate" value={formData.joiningDate} onChange={handleChange} />
          </div>
          <div className="input-group">
            <label>Monthly/Daily Wage *</label>
            <input type="number" name="salary" value={formData.salary} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label className="highlight-label" style={{color: '#d32f2f', fontWeight: 'bold'}}>Login Password *</label>
            <input type="text" name="password" value={formData.password} onChange={handleChange} required className="security-input" />
          </div>
        </div>

        <h3 className="form-section-title">🏦 Bank & Payroll Details</h3>
        <div style={gridStyle}>
          <div className="input-group">
            <label>Bank Name</label>
            <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} />
          </div>
          <div className="input-group">
            <label>Account Number</label>
            <input type="text" name="accountNo" value={formData.accountNo} onChange={handleChange} />
          </div>
          <div className="input-group">
            <label>IFSC Code</label>
            <input type="text" name="ifscCode" value={formData.ifscCode} onChange={handleChange} />
          </div>
        </div>
        
        <div className="input-group" style={{marginTop: '10px'}}>
          <label>Permanent Address</label>
          <input type="text" name="address" value={formData.address} onChange={handleChange} style={{width: '100%'}} />
        </div>

        <div className="form-action-row" style={{textAlign: 'center', marginTop: '30px'}}>
          <button type="submit" className="btn-submit-modern" style={{padding: '12px 40px', fontSize: '16px'}} disabled={loading}>
            {loading ? "Registering..." : "🚀 Finalize Registration"}
          </button>
        </div>
      </form>

      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </div>
  );
};

export default EmployeeAdd;