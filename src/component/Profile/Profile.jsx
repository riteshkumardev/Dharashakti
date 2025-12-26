import React, { useState } from "react";
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

export default function Profile({ user, setUser }) {
  // State Initialization
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [newPassword, setNewPassword] = useState("");
  const [photoURL, setPhotoURL] = useState(
    user?.photoURL || user?.photo || "https://i.imgur.com/6VBx3io.png"
  );
  const [loading, setLoading] = useState(false);

  const db = getDatabase(app);
  const storage = getStorage(app);
  const navigate = useNavigate();

  /* ================= UPDATE PROFILE (NAME & PHONE) ================= */
  const updateProfile = async () => {
    if (!user?.firebaseId) return alert("User ID not found!");
    
    try {
      setLoading(true);

      // Realtime Database mein updates
      const updates = {
        name: name,
        phone: phone,
      };

      await update(ref(db, `employees/${user.firebaseId}`), updates);

      // Local state aur localStorage update karein
      const updatedUser = {
        ...user,
        name,
        phone,
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      alert("✅ Profile details updated successfully!");
    } catch (e) {
      console.error(e);
      alert("❌ Update failed: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  /* ================= CHANGE PASSWORD (DATABASE BASED) ================= */
  const changePassword = async () => {
    try {
      if (newPassword.length < 4) {
        alert("Password must be at least 4 characters");
        return;
      }
      setLoading(true);

      // Hum Auth update nahi karenge kyunki hum custom password use kar rahe hain
      await update(ref(db, `employees/${user.firebaseId}`), {
        password: newPassword,
      });

      // Update local user state
      const updatedUser = { ...user, password: newPassword };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      alert("🔐 Password updated in Database!");
      setNewPassword("");
    } catch (e) {
      alert("❌ Password update failed");
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
      
      // Image path: profileImages/8-digit-id.jpg
      const imageRef = sRef(
        storage,
        `profileImages/${user.firebaseId}.jpg`
      );

      // Uploading...
      await uploadBytes(imageRef, file);
      
      // Get URL
      const downloadURL = await getDownloadURL(imageRef);

      // Database mein photo update karein (photo aur photoURL dono keys update kar rahe hain safety ke liye)
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

      alert("✅ Profile image updated!");
    } catch (err) {
      console.error(err);
      alert("❌ Image upload failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ================= LOGOUT ================= */
  const logout = async () => {
    try {
      setLoading(true);
      // Session clear karein
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

  return (
    <div className="profile-wrapper">
      <div className="profile-card-3d">
        {/* PROFILE IMAGE */}
        <div className="profile-img">
          <img src={photoURL} alt="profile" style={{ objectFit: 'cover' }} />
          <label className="img-edit">
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

        {/* LOGIN INFO (ID Dikhayenge Email ki jagah) */}
        <div className="field">
          <label>Employee ID (Login User)</label>
          <input value={user?.employeeId || user?.firebaseId || ""} disabled style={{ background: '#f0f0f0' }} />
        </div>

        {/* BASIC INFO */}
        <div className="field">
          <label>Full Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter name" />
        </div>

        <div className="field">
          <label>Phone Number</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter phone" />
        </div>

        <button onClick={updateProfile} disabled={loading} className="update-btn">
          {loading ? "Updating..." : "Update Details"}
        </button>

        {/* SECURITY */}
        <div className="divider">Security & Password</div>

        <div className="field">
          <label>New Password</label>
          <input
            type="password"
            placeholder="Min 4 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>

        <button onClick={changePassword} disabled={loading || !newPassword}>
          Change Password
        </button>

        {/* LOGOUT */}
        <button className="danger" onClick={logout} disabled={loading} style={{ marginTop: '20px' }}>
          {loading ? "Closing..." : "🔒 Logout from Device"}
        </button>
      </div>
    </div>
  );
}