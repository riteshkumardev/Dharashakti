import React, { useState } from "react";
import "./ScreenLock.css";

const ScreenLock = ({ user, setIsLocked }) => {
  const [passInput, setPassInput] = useState("");
  const [error, setError] = useState(false);

const handleUnlock = async () => {
  const res = await fetch("http://localhost:5000/api/auth/unlock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      employeeId: user.employeeId,
      password: passInput,
    }),
  });

  const data = await res.json();

  if (data.success) {
    setIsLocked(false);
    setError(false);
  } else {
    setError(true);
    setPassInput("");
    alert("❌ Galat Password!");
  }
};


  return (
    <div className="screen-lock-overlay">
      <div className="lock-card-3d">
        <div className="lock-icon-circle">🔒</div>
        
        <h2 className="lock-title">Session Locked</h2>
        <p className="lock-subtitle">Hi {user.name}, your session is secured.</p>

        <div className="lock-field">
          <input
            type="password"
            placeholder="••••••"
            value={passInput}
            onChange={(e) => setPassInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleUnlock()}
            autoFocus
          />
        </div>

        <button className="unlock-btn" onClick={handleUnlock}>
          🔓 Unlock App
        </button>

        {error && <p style={{color: '#ff8a8a', fontSize: '11px', marginTop: '10px'}}>Wrong Password</p>}
      </div>
    </div>
  );
};

export default ScreenLock;