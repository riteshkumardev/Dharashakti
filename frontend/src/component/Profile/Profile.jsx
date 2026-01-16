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
  
  // Dynamic Backend URL
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  // Initial Photo State
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

  /* ================= UPDATE PROFILE DETAILS ================= */
  const updateProfile = async () => {
    if (!name || !phone) {
      showMsg("Name and Phone are required", "warning");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.put(`${API_URL}/api/profile/update`, {
        employeeId: user.employeeId,
        name,
        phone,
      });

      if (res.data.success) {
        const updatedData = res.data.data;
        localStorage.setItem("user", JSON.stringify(updatedData));
        setUser(updatedData);
        showMsg("✅ Profile updated successfully");
      } else {
        throw new Error(res.data.message);
      }
    } catch (err) {
      showMsg(err.response?.data?.message || "❌ Profile update failed", "error");
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
      const res = await axios.put(`${API_URL}/api/profile/password`, {
        employeeId: user.employeeId,
        password: newPassword,
      });

      if (res.data.success) {
        showMsg("🔐 Password updated successfully");
        setNewPassword("");
      } else {
        throw new Error(res.data.message);
      }
    } catch (err) {
      showMsg(err.response?.data?.message || "❌ Password update failed", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ================= IMAGE UPLOAD LOGIC ================= */
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 1. Client-side Validation (Max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showMsg("❌ File too large. Max limit is 2MB", "warning");
      return;
    }

    const formData = new FormData();
    formData.append("photo", file); // Backend 'multer' field name must be 'photo'
    formData.append("employeeId", user.employeeId);

    try {
      setLoading(true);
      
      const res = await axios.post(`${API_URL}/api/profile/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data.success) {
        const photoPath = res.data.photo;
        // Fix: Absolute vs Relative Path handling
        const fullPhotoPath = photoPath.startsWith('http') ? photoPath : `${API_URL}${photoPath}`;

        const updatedUser = { ...user, photo: fullPhotoPath };
        
        setUser(updatedUser);
        setPhotoURL(fullPhotoPath); 
        
        localStorage.setItem("user", JSON.stringify(updatedUser));
        showMsg("✅ Profile image updated!", "success");
      }
    } catch (err) {
      console.error("Upload Error:", err.response?.data);
      showMsg("❌ Upload failed: " + (err.response?.data?.message || "Internal Server Error"), "error");
    } finally {
      setLoading(false);
    }
  };

  /* ================= LOGOUT ================= */
  const logout = async () => {
    try {
      setLoading(true);
      await axios.post(`${API_URL}/api/profile/logout`, { employeeId: user.employeeId });
    } catch (e) {
      console.error("Logout error", e);
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
          <label className="img-edit" title="Change Photo">
            📸
            <input type="file" accept="image/*" hidden onChange={handleImageChange} />
          </label>
        </div>

        <h2 className="profile-title">{user?.role} Profile</h2>

        <div className="field">
          <label>Employee ID</label>
          <input value={user?.employeeId || ""} disabled style={{backgroundColor: '#f1f5f9', cursor: 'not-allowed'}} />
        </div>

        <div className="field">
          <label>Full Name</label>
          <input 
            type="text"
            value={name} 
            placeholder="Enter your name"
            onChange={(e) => setName(e.target.value)} 
          />
        </div>

        <div className="field">
          <label>Phone Number</label>
          <input 
            type="tel"
            value={phone} 
            placeholder="Enter phone number"
            onChange={(e) => setPhone(e.target.value)} 
          />
        </div>

        <button onClick={updateProfile} className="update-btn" disabled={loading}>
          {loading ? "Updating..." : "Update Details"}
        </button>

        <div className="divider">Security & Password</div>

        <div className="field">
          <label>New Password</label>
          <input
            type="password"
            placeholder="Minimum 4 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>

        <button 
          onClick={changePassword} 
          className="password-btn"
          disabled={!newPassword || loading}
          style={{backgroundColor: !newPassword ? '#cbd5e1' : '#4d47f3'}}
        >
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