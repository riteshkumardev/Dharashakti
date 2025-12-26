import React, { useState, useEffect } from "react";
import "./Profile.css";
import { getDatabase, ref, update } from "firebase/database";
import {
  getStorage,
  ref as sRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { app } from "../../redux/api/firebase/firebase";
import { useNavigate } from "react-router-dom";

// 🏗️ Core Components
import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar"; // ✅ Snackbar Import

export default function Profile({ user, setUser }) {
  // State Initialization
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [newPassword, setNewPassword] = useState("");
  const [photoURL, setPhotoURL] = useState(
    user?.photoURL || user?.photo || "https://i.imgur.com/6VBx3io.png"
  );
  
  // ⏳ Feedback States
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const db = getDatabase(app);
  const storage = getStorage(app);
  const navigate = useNavigate();

  // 🔔 Snackbar Helper
  const showMsg = (msg, type = "success") => {
    setSnackbar({ open: true, message: msg, severity: type });
  };

  /* ================= UPDATE PROFILE (NAME & PHONE) ================= */
  const updateProfile = async () => {
    if (!user?.firebaseId) return showMsg("User ID not found!", "error");
    
    try {
      setLoading(true);

      const updates = {
        name: name,
        phone: phone,
      };

      await update(ref(db, `employees/${user.firebaseId}`), updates);

      const updatedUser = {
        ...user,
        name,
        phone,
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      showMsg("✅ Profile details updated successfully!", "success");
    } catch (e) {
      console.error(e);
      showMsg("❌ Update failed: " + e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  /* ================= CHANGE PASSWORD (DATABASE BASED) ================= */
  const changePassword = async () => {
    try {
      if (newPassword.length < 4) {
        showMsg("Password must be at least 4 characters", "warning");
        return;
      }
      setLoading(true);

      await update(ref(db, `employees/${user.firebaseId}`), {
        password: newPassword,
      });

      const updatedUser = { ...user, password: newPassword };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      showMsg("🔐 Password updated in Database!", "success");
      setNewPassword("");
    } catch (e) {
      showMsg("❌ Password update failed", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ================= IMAGE UPLOAD (FIREBASE STORAGE) ================= */
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      
      const imageRef = sRef(
        storage,
        `profileImages/${user.firebaseId}.jpg`
      );

      await uploadBytes(imageRef, file);
      const downloadURL = await getDownloadURL(imageRef);

      await update(ref(db, `employees/${user.firebaseId}`), {
        photo: downloadURL,
        photoURL: downloadURL,
      });

      const updatedUser = {
        ...user,
        photo: downloadURL,
        photoURL: downloadURL,
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setPhotoURL(downloadURL);

      showMsg("✅ Profile image updated!", "success");
    } catch (err) {
      console.error(err);
      showMsg("❌ Image upload failed: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  /* ================= LOGOUT ================= */
  const logout = async () => {
    try {
      setLoading(true);
      await update(ref(db, `employees/${user.firebaseId}`), {
        currentSessionId: null,
        lastLogoutAt: new Date().toISOString(),
      });
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      localStorage.removeItem("user");
      setUser(null);
      setLoading(false);
      navigate("/login");
    }
  };

  // UI Security: Jab loading ho tab Loader overlay dikhao
  if (loading) return <Loader />;

  return (
    <div className="profile-wrapper">
      <div className="profile-card-3d">
        {/* PROFILE IMAGE */}
        <div className="profile-img">
          <img src={photoURL} alt="profile" style={{ objectFit: 'cover' }} />
          <label className="img-edit" title="Change Photo">
            📸
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleImageChange}
              disabled={loading}
            />
          </label>
        </div>

        <h2 className="profile-title">{user?.role} Profile</h2>

        <div className="field">
          <label>Employee ID (Login User)</label>
          <input value={user?.employeeId || user?.firebaseId || ""} disabled style={{ background: 'rgba(255,255,255,0.05)' }} />
        </div>

        <div className="field">
          <label>Full Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter name" disabled={loading} />
        </div>

        <div className="field">
          <label>Phone Number</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter phone" disabled={loading} />
        </div>

        <button onClick={updateProfile} disabled={loading} className="update-btn">
          {loading ? "Updating..." : "Update Details"}
        </button>

        <div className="divider">Security & Password</div>

        <div className="field">
          <label>New Password</label>
          <input
            type="password"
            placeholder="Min 4 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        <button onClick={changePassword} disabled={loading || !newPassword}>
          {loading ? "Saving..." : "Change Password"}
        </button>

        <button className="danger" onClick={logout} disabled={loading} style={{ marginTop: '20px' }}>
          {loading ? "Logging out..." : "🔒 Logout from Device"}
        </button>
      </div>

      {/* 🔔 CUSTOM SNACKBAR */}
      <CustomSnackbar 
        open={snackbar.open} 
        message={snackbar.message} 
        severity={snackbar.severity} 
        onClose={() => setSnackbar({ ...snackbar, open: false })} 
      />
    </div>
  );
}