import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Loader from "./Core_Component/Loader/Loader";
import CustomSnackbar from "./Core_Component/Snackbar/CustomSnackbar";
import "../App.css";

const generateSessionId = () =>
  "sess_" + Date.now() + "_" + Math.random().toString(36).slice(2, 10);

function Login({ setUser }) {
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔢 Captcha
  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0, total: 0 });
  const [userCaptcha, setUserCaptcha] = useState("");

  // 🔔 Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "error",
  });

  const navigate = useNavigate();

  // Live Backend URL dynamically handle karne ke liye
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const showMsg = (msg, type = "error") =>
    setSnackbar({ open: true, message: msg, severity: type });

  const refreshCaptcha = () => {
    const n1 = Math.floor(Math.random() * 10) + 1;
    const n2 = Math.floor(Math.random() * 10) + 1;
    setCaptcha({ num1: n1, num2: n2, total: n1 + n2 });
    setUserCaptcha("");
  };

  useEffect(() => {
    refreshCaptcha();
    const savedUser = localStorage.getItem("user");
    if (savedUser) navigate("/", { replace: true });
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Captcha validation
    if (parseInt(userCaptcha) !== captcha.total) {
      showMsg("❌ Invalid Captcha. Try again.");
      refreshCaptcha();
      return;
    }

    if (!/^\d{8}$/.test(employeeId.trim())) {
      showMsg("Please enter a valid 8-digit Employee ID.", "warning");
      return;
    }

    setLoading(true);

    try {
      // Yahan ab live API URL use ho raha hai
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: employeeId.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showMsg(data.message || "Login failed");
        refreshCaptcha();
        setLoading(false);
        return;
      }

      const sessionId = generateSessionId();
      const finalUser = { ...data.data, currentSessionId: sessionId };

      localStorage.setItem("user", JSON.stringify(finalUser));
      setUser(finalUser);

      setTimeout(() => {
        setLoading(false);
        navigate("/", { replace: true });
      }, 500);
    } catch (err) {
      console.error("Login error:", err);
      showMsg("Server error. Please try again.");
      refreshCaptcha();
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="login-box">
      <h2>Dharashakti Login</h2>

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Employee ID</label>
          <input
            type="text"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            maxLength="8"
            required
          />
        </div>

        <div className="input-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="captcha-container" style={{ marginBottom: "15px" }}>
          <label>Verify Captcha</label>
          <div style={{ display: "flex", gap: "10px" }}>
            <div
              style={{
                background: "#eee",
                padding: "6px 10px",
                borderRadius: "4px",
                fontWeight: "bold",
              }}
            >
              {captcha.num1} + {captcha.num2} = ?
            </div>
            <button type="button" onClick={refreshCaptcha}>🔄</button>
          </div>
          <input
            type="number"
            placeholder="Result"
            value={userCaptcha}
            onChange={(e) => setUserCaptcha(e.target.value)}
            required
            style={{ marginTop: "8px" }}
          />
        </div>

        <button type="submit">Login Now</button>
      </form>

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
