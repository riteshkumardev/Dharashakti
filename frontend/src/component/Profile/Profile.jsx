import React, { useState } from "react";
import "./Profile.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";

// 🏗️ Core Components
import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

export default function Profile({ user, setUser }) {
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [newPassword, setNewPassword] = useState("");
  
  // Live Backend URL dynamically handle karne ke liye
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const [photoURL, setPhotoURL] = useState(
    user?.photo || "https://i.imgur.com/6VBx3io.png"
  );

  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const navigate = useNavigate();

  const showMsg = (msg, type = "success") => {
    setSnackbar({ open: true, message: msg, severity: type });
  };

  /* ================= UPDATE PROFILE ================= */
  const updateProfile = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/api/profile/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: user.employeeId,
          name,
          phone,
        }),
      });

      const data = await res.json();

      if (!data.success) throw new Error();

      localStorage.setItem("user", JSON.stringify(data.data));
      setUser(data.data);
      showMsg("✅ Profile updated successfully");
    } catch {
      showMsg("❌ Profile update failed", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ================= CHANGE PASSWORD ================= */
  const changePassword = async () => {
    if (newPassword.length < 4) {
      showMsg("Password must be at least 4 characters", "warning");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/api/profile/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: user.employeeId,
          password: newPassword,
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error();

      showMsg("🔐 Password updated");
      setNewPassword("");
    } catch {
      showMsg("❌ Password update failed", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ================= IMAGE UPLOAD ================= */
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("photo", file); 
    formData.append("employeeId", user.employeeId);

    try {
      setLoading(true);
      
      const res = await axios.post(`${API_URL}/api/profile/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data.success) {
        // Live URL handle karne ke liye (Agar Vercel hai toh usi URL ko use karein)
        const photoPath = res.data.photo;
        const fullPhotoPath = photoPath.startsWith('http') ? photoPath : `${API_URL}${photoPath}`;

        const updatedUser = { ...user, photo: fullPhotoPath };
        
        setUser(updatedUser);
        setPhotoURL(fullPhotoPath); 
        
        localStorage.setItem("user", JSON.stringify(updatedUser));
        showMsg("✅ Profile image updated successfully!", "success");
      }
    } catch (err) {
      console.error("Upload Error:", err);
      showMsg("❌ Image upload failed: " + (err.response?.data?.message || "Server Error"), "error");
    } finally {
      setLoading(false);
    }
  };

  /* ================= LOGOUT ================= */
  const logout = async () => {
    try {
      setLoading(true);

      await fetch(`${API_URL}/api/profile/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: user.employeeId }),
      });
    } catch (e) {
      console.error(e);
    } finally {
      localStorage.removeItem("user");
      setUser(null);
      setLoading(false);
      navigate("/login");
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="profile-wrapper">
      <div className="profile-card-3d">
        <div className="profile-img">
          <img src={photoURL} alt="profile" style={{ objectFit: "cover" }} />
          <label className="img-edit">
            📸
            <input type="file" hidden onChange={handleImageChange} />
          </label>
        </div>

        <h2 className="profile-title">{user?.role} Profile</h2>

        <div className="field">
          <label>Employee ID</label>
          <input value={user?.employeeId} disabled />
        </div>

        <div className="field">
          <label>Full Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="field">
          <label>Phone Number</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>

        <button onClick={updateProfile} className="update-btn">
          Update Details
        </button>

        <div className="divider">Security & Password</div>

        <div className="field">
          <label>New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>

        <button onClick={changePassword} disabled={!newPassword}>
          Change Password
        </button>

        <button className="danger" onClick={logout} style={{ marginTop: "20px" }}>
          🔒 Logout
        </button>
      </div>

      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </div>
  );
}