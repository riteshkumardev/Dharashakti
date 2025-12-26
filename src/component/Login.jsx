import React, { useState, useEffect } from "react";
import { getDatabase, ref, get, update } from "firebase/database";
import { app } from "../redux/api/firebase/firebase";
import { useNavigate } from "react-router-dom";
import Loader from "./Core_Component/Loader/Loader"; 
import CustomSnackbar from "./Core_Component/Snackbar/CustomSnackbar"; // ✅ Snackbar Import
import "../App.css";

const generateSessionId = () =>
  "sess_" + Date.now() + "_" + Math.random().toString(36).slice(2, 10);

function Login({ setUser }) {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  /* --- 🔢 Captcha States --- */
  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0, total: 0 });
  const [userCaptcha, setUserCaptcha] = useState("");

  /* 🔔 Snackbar State */
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "error" });

  const navigate = useNavigate();
  const db = getDatabase(app);

  // Snackbar Helper
  const showMsg = (msg, type = "error") => {
    setSnackbar({ open: true, message: msg, severity: type });
  };

  const refreshCaptcha = () => {
    const n1 = Math.floor(Math.random() * 10) + 1;
    const n2 = Math.floor(Math.random() * 10) + 1;
    setCaptcha({ num1: n1, num2: n2, total: n1 + n2 });
    setUserCaptcha(""); 
  };

  useEffect(() => {
    refreshCaptcha();
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Captcha Verification
    if (parseInt(userCaptcha) !== captcha.total) {
      showMsg("❌ Invalid Captcha. Please solve again.", "error");
      refreshCaptcha();
      return;
    }

    setLoading(true); 
    const cleanId = employeeId.trim();

    if (!/^\d{8}$/.test(cleanId)) {
      showMsg("Please enter a valid 8-digit numeric ID.", "warning");
      setLoading(false);
      return;
    }

    try {
      const usersRef = ref(db, "employees");
      const snapshot = await get(usersRef);

      if (!snapshot.exists()) {
        showMsg("No employees registered in system.", "error");
        setLoading(false);
        return;
      }

      const usersData = snapshot.val();
      const foundKey = Object.keys(usersData).find(
        (key) => usersData[key].employeeId === cleanId
      );

      if (!foundKey) {
        showMsg("❌ Invalid Employee ID.", "error");
        refreshCaptcha();
        setLoading(false);
        return;
      }

      const userData = usersData[foundKey];

      // 3. Password Verification
      if (userData.password !== password) {
        showMsg("❌ Incorrect Password.", "error");
        refreshCaptcha();
        setLoading(false);
        return;
      }

      // 4. Blocked status check
      if (userData.isBlocked) {
        showMsg("🚫 Your account is blocked by Admin.", "error");
        setLoading(false);
        return;
      }

      // 5. 🔐 Session Logic
      const sessionId = generateSessionId();
      await update(ref(db, `employees/${foundKey}`), {
        currentSessionId: sessionId,
        lastLoginAt: new Date().toISOString(),
      });

      // Artificial Delay for professional feel
      setTimeout(() => {
        localStorage.removeItem("user");
        const finalUser = {
          firebaseId: foundKey,
          ...userData,
          currentSessionId: sessionId,
        };

        localStorage.setItem("user", JSON.stringify(finalUser));
        setUser(finalUser);
        setLoading(false); 
        navigate("/", { replace: true });
      }, 1000);

    } catch (err) {
      showMsg("Login failed: " + err.message, "error");
      refreshCaptcha();
      setLoading(false);
    }
  };

  // ✅ UI Logic: Jab tak verify ho raha ho, Loader dikhega
  if (loading) return <Loader />;

  return (
    <div className="login-box">
      <h2>Dharashakti Login</h2>

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
            disabled={loading}
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
            disabled={loading}
          />
        </div>

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
              letterSpacing: "2px",
              color: "#333"
            }}>
              {captcha.num1} + {captcha.num2} = ?
            </div>
            <button 
              type="button" 
              onClick={refreshCaptcha} 
              disabled={loading}
              style={{ padding: "5px", background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", width: "20%" }}
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
            disabled={loading}
            style={{ marginTop: "10px" }}
          />
        </div>

        <button type="submit" disabled={loading} style={{ marginTop: "10px" }}>
          {loading ? "Verifying Access..." : "Login Now"}
        </button>
      </form>

      {/* 🔔 MUI Snackbar for Modern Errors */}
      <CustomSnackbar 
        open={snackbar.open} 
        message={snackbar.message} 
        severity={snackbar.severity} 
        onClose={() => setSnackbar({ ...snackbar, open: false })} 
      />
    </div>
  );
}

export default Login;