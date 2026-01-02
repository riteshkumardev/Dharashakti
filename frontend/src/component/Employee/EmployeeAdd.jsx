import React, { useState } from 'react';
import './Emp.css';

// 🏗️ Core Components Import
import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

const EmployeeAdd = ({ onEntrySaved }) => {

  // ⏳ States for Feedback
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const [formData, setFormData] = useState({
    name: "",
    fatherName: "",
    phone: "",
    emergencyPhone: "",
    aadhar: "",
    address: "",
    designation: "Worker",
    joiningDate: new Date().toISOString().split("T")[0],
    salary: "",
    bankName: "",
    accountNo: "",
    ifscCode: "",
    photo: "",
    password: ""
  });

  // 🔔 Snackbar Helper
  const showMsg = (msg, type = "success") => {
    setSnackbar({ open: true, message: msg, severity: type });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, photo: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

 // ... baaki imports same rahenge

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!formData.name || !formData.aadhar || !formData.salary || !formData.password) {
    showMsg("Please fill Name, Aadhar, Salary and Password!", "warning");
    return;
  }

  setLoading(true);

  try {
    // 🛠️ Yahan 'role' field add ki gayi hai jo 'designation' se value legi
    const dataToSubmit = {
      ...formData,
      role: formData.designation // Taki backend ko sahi role mile
    };

    const res = await fetch("http://localhost:5000/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataToSubmit),
    });

    const data = await res.json();

    if (!res.ok) {
      showMsg(data.message || "Employee registration failed", "error");
      setLoading(false);
      return;
    }

    // ✅ SUCCESS
    showMsg(`🎉 Employee Registered! ID: ${data.employeeId}`, "success");

    if (onEntrySaved) onEntrySaved();

    // Reset Form
    setFormData({
      name: "", fatherName: "", phone: "", emergencyPhone: "",
      aadhar: "", address: "", designation: "Worker",
      joiningDate: new Date().toISOString().split("T")[0],
      salary: "", bankName: "", accountNo: "", ifscCode: "",
      photo: "", password: ""
    });

  } catch (err) {
    showMsg("Registration Error: Server not reachable", "error");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="table-card-wide">
      {loading && <Loader />}

      <h2 className="table-title">Employee Registration Form</h2>

      <form onSubmit={handleSubmit} className="stock-form-grid">
        {/* --- FORM JSX COMPLETELY UNCHANGED --- */}

        <div className="input-group">
          <label>Employee Name *</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required disabled={loading} />
        </div>

        <div className="input-group">
          <label>Father's Name</label>
          <input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} disabled={loading} />
        </div>

        <div className="input-group">
          <label>Profile Photo</label>
          <input type="file" accept="image/*" onChange={handlePhotoChange} disabled={loading} />
        </div>

        <div className="input-group">
          <label>Phone Number *</label>
          <input type="number" name="phone" value={formData.phone} onChange={handleChange} required disabled={loading} />
        </div>

        <div className="input-group">
          <label>Emergency Contact</label>
          <input type="number" name="emergencyPhone" value={formData.emergencyPhone} onChange={handleChange} disabled={loading} />
        </div>

        <div className="input-group">
          <label>Aadhar Number *</label>
          <input type="number" name="aadhar" value={formData.aadhar} onChange={handleChange} required disabled={loading} />
        </div>

        <div className="input-group">
          <label>Designation</label>
          <select name="designation" value={formData.designation} onChange={handleChange} disabled={loading}>
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
          <input type="date" name="joiningDate" value={formData.joiningDate} onChange={handleChange} disabled={loading} />
        </div>

        <div className="input-group">
          <label>Monthly Salary / Daily Wage *</label>
          <input type="number" name="salary" value={formData.salary} onChange={handleChange} required disabled={loading} />
        </div>

        <div className="input-group">
          <label>Bank Name</label>
          <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} disabled={loading} />
        </div>

        <div className="input-group">
          <label>Account Number</label>
          <input type="text" name="accountNo" value={formData.accountNo} onChange={handleChange} disabled={loading} />
        </div>

        <div className="input-group">
          <label>IFSC Code</label>
          <input type="text" name="ifscCode" value={formData.ifscCode} onChange={handleChange} disabled={loading} />
        </div>

        <div className="input-group">
          <label style={{ color: '#d32f2f', fontWeight: 'bold' }}>Login Password *</label>
          <input
            type="text"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className="input-group span-4">
          <label>Full Address</label>
          <input type="text" name="address" value={formData.address} onChange={handleChange} disabled={loading} />
        </div>

        <div className="button-container-full">
          <button type="submit" className="btn-submit-colored" disabled={loading}>
            {loading ? "Registering Employee..." : "✅ Register Employee"}
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
