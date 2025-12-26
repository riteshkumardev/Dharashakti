import React, { useState } from 'react';
import { getDatabase, ref, push, set, get, child } from "firebase/database";
import { app } from "../../redux/api/firebase/firebase";
import './Emp.css';

const EmployeeAdd = ({ onEntrySaved }) => {
  const db = getDatabase(app);
  const [loading, setLoading] = useState(false);

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
    password: "" // 👈 Naya field add kiya
  });

  // --- 8-Digit Unique ID Generator Function (Wahi purana logic) ---
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
    // 👈 Password validation bhi add ki gayi hai
    if (!formData.name || !formData.aadhar || !formData.salary || !formData.password) {
      alert("Please fill Name, Aadhar, Salary and Password!");
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

      alert(`🎉 New Employee Registered! \nID: ${empID} \nPassword: ${formData.password}`);
      if (onEntrySaved) onEntrySaved();
      
      setFormData({
        name: "", fatherName: "", phone: "", emergencyPhone: "",
        aadhar: "", address: "", designation: "Worker",
        joiningDate: new Date().toISOString().split("T")[0],
        salary: "", bankName: "", accountNo: "", ifscCode: "", photo: "",
        password: "" // 👈 Reset password field
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
      <form onSubmit={handleSubmit} className="stock-form-grid">
        
        <div className="input-group">
          <label>Employee Name *</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        <div className="input-group">
          <label>Father's Name</label>
          <input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} />
        </div>
        <div className="input-group">
          <label>Profile Photo</label>
          <input type="file" accept="image/*" onChange={handlePhotoChange} />
        </div>

        <div className="input-group">
          <label>Phone Number *</label>
          <input type="number" name="phone" value={formData.phone} onChange={handleChange} required />
        </div>
        <div className="input-group">
          <label>Emergency Contact</label>
          <input type="number" name="emergencyPhone" value={formData.emergencyPhone} onChange={handleChange} />
        </div>
        <div className="input-group">
          <label>Aadhar Number *</label>
          <input type="number" name="aadhar" value={formData.aadhar} onChange={handleChange} required />
        </div>

        <div className="input-group">
          <label>Designation</label>
          <select name="designation" value={formData.designation} onChange={handleChange}>
            <option value="Manager">Manager</option>
            <option value="Operator">Operator</option>
            <option value="Worker">Worker</option>
            <option value="Driver">Driver</option>
            <option value="Helper">Helper</option>
            <option value="Admin">Admin</option> {/* Admin option agar aap dena chahein */}
          </select>
        </div>
        <div className="input-group">
          <label>Joining Date</label>
          <input type="date" name="joiningDate" value={formData.joiningDate} onChange={handleChange} />
        </div>
        <div className="input-group">
          <label>Monthly Salary / Daily Wage *</label>
          <input type="number" name="salary" value={formData.salary} onChange={handleChange} required />
        </div>

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

        {/* 🔥 YAHAN PASSWORD FIELD ADD KIYA HAI 🔥 */}
        <div className="input-group">
          <label style={{color: '#d32f2f', fontWeight: 'bold'}}>Login Password *</label>
          <input 
            type="text" 
            name="password" 
            placeholder="Create password" 
            value={formData.password} 
            onChange={handleChange} 
            required 
            style={{borderColor: '#ffcdd2'}}
          />
        </div>

        <div className="input-group span-4">
          <label>Full Address</label>
          <input type="text" name="address" value={formData.address} onChange={handleChange} />
        </div>

        <div className="button-container-full">
          <button type="submit" className="btn-submit-colored" disabled={loading}>
            {loading ? "Registering..." : "✅ Register Employee"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeAdd;