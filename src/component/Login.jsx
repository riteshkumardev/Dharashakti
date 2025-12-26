import React, { useState, useEffect } from "react";
import { getDatabase, ref, get, update } from "firebase/database";
import { app } from "../redux/api/firebase/firebase";
import { useNavigate } from "react-router-dom";
import "../App.css";
import { SnackBar } from "./Core_Component/Snackbar/SnackBar";

// 🔑 Unique session id (ID-based single login)
const generateSessionId = () =>
  "sess_" + Date.now() + "_" + Math.random().toString(36).slice(2, 10);

function Login({ setUser }) {
  const [employeeId, setEmployeeId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const db = getDatabase(app);

  // 🔁 Agar already valid login hai to home
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

    const cleanId = employeeId.trim();

    if (!/^\d{8}$/.test(cleanId)) {
      setError("Please enter a valid 8-digit numeric ID.");
      setLoading(false);
      return;
    }

    try {
      const usersRef = ref(db, "employees");
      const snapshot = await get(usersRef);

      if (!snapshot.exists()) {
        setError("No employees registered.");
        return;
      }

      const usersData = snapshot.val();

      const foundKey = Object.keys(usersData).find(
        (key) => usersData[key].employeeId === cleanId
      );

      if (!foundKey) {
        setError("❌ Invalid Employee ID.");
        return;
      }

      const userData = usersData[foundKey];

      if (userData.isBlocked) {
        setError("🚫 Your account is blocked by Admin.");
        return;
      }

      // 🔐 NEW SESSION (overwrites old → auto logout on other device)
      const sessionId = generateSessionId();

      await update(ref(db, `employees/${foundKey}`), {
        currentSessionId: sessionId,
        lastLoginAt: new Date().toISOString(),
      });

      // 🧹 Purana user clear (safety)
      localStorage.removeItem("user");

      const finalUser = {
        firebaseId: foundKey,
        ...userData,
        currentSessionId: sessionId,
      };

      localStorage.setItem("user", JSON.stringify(finalUser));
      setUser(finalUser);

      navigate("/", { replace: true });
    } catch (err) {
      setError("Login failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-box">
      <h2>Dharashakti Login</h2>

      {error && (
        <p style={{ color: "red", fontWeight: "bold" }}>{error}</p>
      )}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter 8-Digit ID"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          maxLength="8"
          inputMode="numeric"
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
