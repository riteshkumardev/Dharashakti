import React, { useState } from 'react';
import { getDatabase, ref, set, get, child } from "firebase/database";
import { app } from "../../redux/api/firebase/firebase";
import './Emp.css';

// 👈 role prop add kiya gaya
const EmployeeAdd = ({ onEntrySaved, role }) => {
  const db = getDatabase(app);
  const [loading, setLoading] = useState(false);

  // 🔐 Permission Check: Sirf Admin hi naya employee register kar sakta hai
  const isAuthorized = role === "Admin"; 

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
    photo: "" 
  });

  // --- 8-Digit Unique ID Generator (Unchanged) ---
  const generateUniqueID = async () => {
    let isUnique = false;
    let newID = "";
    const dbRef = ref(getDatabase());

    while (!isUnique) {
      newID = Math.floor(10000000 + Math.random() * 90000000).toString();
      const snapshot = await get(child(dbRef, `employees/${newID}`));
      if (!snapshot.exists()) {
        isUnique = true;
      }
    }
    return newID;
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🛑 Security Guard
    if (!isAuthorized) {
      alert("Aapke paas employee register karne ki permission nahi hai. Sirf Admin hi ye kar sakta hai.");
      return;
    }

    if (!formData.name || !formData.aadhar || !formData.salary) {
      alert("Please fill Name, Aadhar and Salary!");
      return;
    }

    setLoading(true);
    try {
      const empID = await generateUniqueID();
      const empRef = ref(db, `employees/${empID}`);
      
      await set(empRef, {
        ...formData,
        employeeId: empID,
        createdAt: new Date().toISOString()
      });

      alert(`🎉 New Employee Registered! \nID: ${empID}`);
      if (onEntrySaved) onEntrySaved();
      
      setFormData({
        name: "", fatherName: "", phone: "", emergencyPhone: "",
        aadhar: "", address: "", designation: "Worker",
        joiningDate: new Date().toISOString().split("T")[0],
        salary: "", bankName: "", accountNo: "", ifscCode: "", photo: ""
      });
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="table-card-wide">
      <h2 className="table-title">Employee Registration Form</h2>
      
      {/* ⚠️ Warning for non-admins */}
      {!isAuthorized && (
        <div className="admin-warning-box" style={{color: 'red', marginBottom: '15px', fontWeight: 'bold'}}>
          ⚠️ Access Denied: Sirf Admin hi naya staff add kar sakte hain.
        </div>
      )}

      <form onSubmit={handleSubmit} className="stock-form-grid">
        
        <div className="input-group">
          <label>Employee Name *</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required disabled={!isAuthorized} />
        </div>
        <div className="input-group">
          <label>Father's Name</label>
          <input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} disabled={!isAuthorized} />
        </div>
        <div className="input-group">
          <label>Profile Photo</label>
          <input type="file" accept="image/*" onChange={handlePhotoChange} disabled={!isAuthorized} />
        </div>

        <div className="input-group">
          <label>Phone Number *</label>
          <input type="number" name="phone" value={formData.phone} onChange={handleChange} required disabled={!isAuthorized} />
        </div>
        <div className="input-group">
          <label>Emergency Contact</label>
          <input type="number" name="emergencyPhone" value={formData.emergencyPhone} onChange={handleChange} disabled={!isAuthorized} />
        </div>
        <div className="input-group">
          <label>Aadhar Number *</label>
          <input type="number" name="aadhar" value={formData.aadhar} onChange={handleChange} required disabled={!isAuthorized} />
        </div>

        <div className="input-group">
          <label>Designation</label>
          <select name="designation" value={formData.designation} onChange={handleChange} disabled={!isAuthorized}>
            <option value="Manager">Manager</option>
            <option value="Operator">Operator</option>
            <option value="Worker">Worker</option>
            <option value="Driver">Driver</option>
            <option value="Helper">Helper</option>
          </select>
        </div>
        <div className="input-group">
          <label>Joining Date</label>
          <input type="date" name="joiningDate" value={formData.joiningDate} onChange={handleChange} disabled={!isAuthorized} />
        </div>
        <div className="input-group">
          <label>Monthly Salary / Daily Wage *</label>
          <input type="number" name="salary" value={formData.salary} onChange={handleChange} required disabled={!isAuthorized} />
        </div>

        <div className="input-group">
          <label>Bank Name</label>
          <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} disabled={!isAuthorized} />
        </div>
        <div className="input-group">
          <label>Account Number</label>
          <input type="text" name="accountNo" value={formData.accountNo} onChange={handleChange} disabled={!isAuthorized} />
        </div>
        <div className="input-group">
          <label>IFSC Code</label>
          <input type="text" name="ifscCode" value={formData.ifscCode} onChange={handleChange} disabled={!isAuthorized} />
        </div>

        <div className="input-group span-4">
          <label>Full Address</label>
          <input type="text" name="address" value={formData.address} onChange={handleChange} disabled={!isAuthorized} />
        </div>

        <div className="button-container-full">
          <button 
            type="submit" 
            className="btn-submit-colored" 
            disabled={loading || !isAuthorized}
            style={{ opacity: isAuthorized ? 1 : 0.6 }}
          >
            {loading ? "Registering..." : !isAuthorized ? "🔒 Admin Only" : "✅ Register Employee"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeAdd;