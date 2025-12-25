import React, { useState, useEffect } from "react";
import { getDatabase, ref, get } from "firebase/database";
import { app } from "../redux/api/firebase/firebase";
import { useNavigate } from "react-router-dom";
import "../App.css";

function Login({ setUser }) {
  const [employeeId, setEmployeeId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const db = getDatabase(app);

  // Agar user pehle se login hai, toh use Home par bhej do
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (employeeId.length < 8) {
      setError("Please enter a valid 8-digit ID.");
      setLoading(false);
      return;
    }

    try {
      const usersRef = ref(db, "employees");
      const snapshot = await get(usersRef);

      if (snapshot.exists()) {
        const usersData = snapshot.val();
        
        // Database mein 8-digit ID dhoondna
        const foundUserKey = Object.keys(usersData).find(
          (key) => usersData[key].employeeId === employeeId
        );

        if (foundUserKey) {
          const userData = { firebaseId: foundUserKey, ...usersData[foundUserKey] };

          // 1. Check karein Account Block toh nahi hai
          if (userData.isBlocked) {
            setError("🚫 Your account is blocked by Admin.");
          } else {
            // 2. LocalStorage mein save karein (Redux ki zarurat nahi)
            localStorage.setItem("user", JSON.stringify(userData));
            
            // 3. App.js ki user state update karein
            setUser(userData);
            
            // 4. Navigate to Home
            navigate("/", { replace: true });
          }
        } else {
          setError("❌ Invalid Employee ID. Please check and try again.");
        }
      } else {
        setError("No employees registered in the system.");
      }
    } catch (err) {
      setError("Login failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-box">
      <h2>Dharashakti Login</h2>
      <p style={{ fontSize: '12px', color: '#666', marginBottom: '20px' }}>
        Please enter your 8-digit unique ID to access the dashboard.
      </p>

      {error && <p className="error-msg" style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter 8-Digit ID"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          maxLength="8"
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Verifying..." : "Login Now"}
        </button>
      </form>

      
    </div>
  );
}

export default Login;