import React, { useState, useEffect } from "react";
import { getDatabase, ref, get, update } from "firebase/database";
import { app } from "../redux/api/firebase/firebase";
import { useNavigate } from "react-router-dom";
import "../App.css";

// 🔑 Unique session id generator
const generateSessionId = () =>
  "sess_" + Date.now() + "_" + Math.random().toString(36).slice(2, 10);

function Login({ setUser }) {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* --- 🔢 Captcha States --- */
  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0, total: 0 });
  const [userCaptcha, setUserCaptcha] = useState("");

  const navigate = useNavigate();
  const db = getDatabase(app);

  // 🔄 Function to generate new Captcha
  const refreshCaptcha = () => {
    const n1 = Math.floor(Math.random() * 10) + 1;
    const n2 = Math.floor(Math.random() * 10) + 1;
    setCaptcha({ num1: n1, num2: n2, total: n1 + n2 });
    setUserCaptcha(""); // Reset input field
  };

  useEffect(() => {
    // Pehli baar load hone par captcha generate karein
    refreshCaptcha();

    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // 1. Captcha Verification (First Step)
    if (parseInt(userCaptcha) !== captcha.total) {
      setError("❌ Invalid Captcha. Please solve again.");
      refreshCaptcha(); // Captcha badal dein
      return;
    }

    setLoading(true);
    const cleanId = employeeId.trim();

    // 2. ID Validation
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
        setLoading(false);
        return;
      }

      const usersData = snapshot.val();
      const foundKey = Object.keys(usersData).find(
        (key) => usersData[key].employeeId === cleanId
      );

      if (!foundKey) {
        setError("❌ Invalid Employee ID.");
        setLoading(false);
        refreshCaptcha();
        return;
      }

      const userData = usersData[foundKey];

      // 3. Password Verification
      if (userData.password !== password) {
        setError("❌ Incorrect Password.");
        setLoading(false);
        refreshCaptcha();
        return;
      }

      // 4. Blocked status check
      if (userData.isBlocked) {
        setError("🚫 Your account is blocked by Admin.");
        setLoading(false);
        return;
      }

      // 5. 🔐 Session Logic
      const sessionId = generateSessionId();
      await update(ref(db, `employees/${foundKey}`), {
        currentSessionId: sessionId,
        lastLoginAt: new Date().toISOString(),
      });

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
      refreshCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-box">
      <h2>Dharashakti Login</h2>

      {error && (
        <p style={{ color: "red", fontWeight: "bold", textAlign: "center" }}>{error}</p>
      )}

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Employee ID</label>
          <input
            type="text"
            placeholder="Enter 8-Digit ID"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            maxLength="8"
            inputMode="numeric"
            required
          />
        </div>

        <div className="input-group">
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {/* 🔥 Captcha UI 🔥 */}
        <div className="captcha-container" style={{ marginBottom: "15px" }}>
          <label>Verify Captcha</label>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              background: "#eee",
              padding: "4px 8px",
              borderRadius: "4px",
              fontWeight: "bold",
              width: "80%",
              fontSize: "1.2rem",
              userSelect: "none",
              letterSpacing: "2px"
            }}>
              {captcha.num1} + {captcha.num2} = ?
            </div>
            <button 
              type="button" 
              onClick={refreshCaptcha} 
              style={{ padding: "5px", background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem" ,width:"20%"}}
              title="Refresh Captcha"
            >
              🔄
            </button>
          </div>
          <input
            type="number"
            placeholder="Result"
            value={userCaptcha}
            onChange={(e) => setUserCaptcha(e.target.value)}
            required
            style={{ marginTop: "10px" }}
          />
        </div>

        <button type="submit" disabled={loading} style={{ marginTop: "10px" }}>
          {loading ? "Verifying..." : "Login Now"}
        </button>
      </form>
    </div>
  );
}

export default Login;