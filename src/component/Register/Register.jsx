import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDatabase, ref, set, get, child } from "firebase/database"; 
import { app } from "../../redux/api/firebase/firebase";
import "./Register.css";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    aadhar: "",
    password: "",
    photo: ""
  });
  const [loading, setLoading] = useState(false);
  const [generatedId, setGeneratedId] = useState(null);

  const navigate = useNavigate();
  const db = getDatabase(app);

  // --- 1. Unique 8-Digit ID Generator ---
  const generateID = async () => {
    let isUnique = false;
    let newID = "";
    const dbRef = ref(db);

    while (!isUnique) {
      newID = Math.floor(10000000 + Math.random() * 90000000).toString();
      const snapshot = await get(child(dbRef, `employees/${newID}`));
      if (!snapshot.exists()) {
        isUnique = true;
      }
    }
    return newID;
  };

  // --- 2. Image to Base64 Converter ---
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

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const newAdminId = await generateID();

      // 3. Employees node mein hi admin data save karna
      // Isse aapka Master Panel aur Login dono ise detect kar payenge
      await set(ref(db, 'employees/' + newAdminId), {
        employeeId: newAdminId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        aadhar: formData.aadhar,
        password: formData.password, // Login verification ke liye
        role: "Admin", // Master Admin Role
        isBlocked: false,
        photo: formData.photo,
        createdAt: new Date().toISOString()
      });

      setGeneratedId(newAdminId);
      alert(`🎉 Registration Successful!\nYour Login ID is: ${newAdminId}\nKripya is ID ko note kar lein.`);
      
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-box register-wide">
      <h2>System Admin Registration</h2>
      
      {!generatedId ? (
        <form onSubmit={handleRegister}>
          <div className="reg-grid">
            <input type="text" placeholder="Full Name" onChange={(e)=>setFormData({...formData, name: e.target.value})} required />
            <input type="email" placeholder="Email Address" onChange={(e)=>setFormData({...formData, email: e.target.value})} required />
            <input type="number" placeholder="Phone Number" onChange={(e)=>setFormData({...formData, phone: e.target.value})} required />
            <input type="number" placeholder="Aadhar Number" onChange={(e)=>setFormData({...formData, aadhar: e.target.value})} required />
            <input type="password" placeholder="Create Password" onChange={(e)=>setFormData({...formData, password: e.target.value})} required />
            
            <div className="photo-upload">
              <label>Profile Photo:</label>
              <input type="file" accept="image/*" onChange={handlePhotoChange} required />
            </div>
          </div>

          <button type="submit" disabled={loading} className="register-btn-main">
            {loading ? "Generating Secure ID..." : "Register as Admin"}
          </button>
        </form>
      ) : (
        <div className="success-card">
          <h3 style={{color: 'green'}}>Registration Complete!</h3>
          <div className="id-display-box">
            <span>Your Login ID:</span>
            <h1>{generatedId}</h1>
          </div>
          <p>Use this 8-digit ID to login to your dashboard.</p>
          <button onClick={() => navigate("/login")} className="login-now-btn">Go to Login</button>
        </div>
      )}
    </div>
  );
}

export default Register;