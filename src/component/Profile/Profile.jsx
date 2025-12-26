import { useState } from "react";
import "./Profile.css";
import { getAuth, updatePassword, signOut } from "firebase/auth";
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
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [newPassword, setNewPassword] = useState("");
  const [photoURL, setPhotoURL] = useState(
    user?.photoURL || "https://i.imgur.com/6VBx3io.png"
  );
  const [loading, setLoading] = useState(false);

  const auth = getAuth(app);
  const db = getDatabase(app);
  const storage = getStorage(app);
  const navigate = useNavigate();

  /* ================= UPDATE PROFILE ================= */
  const updateProfile = async () => {
    try {
      setLoading(true);

      await update(ref(db, `employees/${user.firebaseId}`), {
        name,
        phone,
        photoURL,
      });

      const updatedUser = {
        ...user,
        name,
        phone,
        photoURL,
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      alert("✅ Profile updated");
    } catch (e) {
      console.error(e);
      alert("❌ Update failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= CHANGE PASSWORD ================= */
  const changePassword = async () => {
    try {
      if (newPassword.length < 6) {
        alert("Password must be 6+ characters");
        return;
      }
      await updatePassword(auth.currentUser, newPassword);
      alert("🔐 Password updated");
      setNewPassword("");
    } catch (e) {
      alert("❌ Re-login required for security");
    }
  };

  /* ================= LOGOUT ================= */
  const logout = async () => {
    try {
      await update(ref(db, `employees/${user.firebaseId}`), {
        currentSessionId: null,
        lastLogoutAt: new Date().toISOString(),
      });
      await signOut(auth);
    } catch (e) {
      console.error(e);
    } finally {
      localStorage.removeItem("user");
      setUser(null);
      navigate("/login");
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
        photoURL: downloadURL,
      });

      const updatedUser = {
        ...user,
        photoURL: downloadURL,
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setPhotoURL(downloadURL);

      alert("✅ Profile image updated");
    } catch (err) {
      console.error(err);
      alert("❌ Image upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-wrapper">
      <div className="profile-card-3d">
        {/* PROFILE IMAGE */}
        <div className="profile-img">
          <img src={photoURL} alt="profile" />
          <label className="img-edit">
            📸
            <input
              // type="file"
              // accept="image/*"
              hidden
              // onChange={handleImageChange}
            />
          </label>
        </div>

        <h2 className="profile-title">Secure Profile</h2>

        {/* LOGIN INFO */}
        <div className="field">
          <label>Email (Login ID)</label>
          <input value={user?.email || ""} disabled />
        </div>

        {/* BASIC INFO */}
        <div className="field">
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="field">
          <label>Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>

        <button onClick={updateProfile} disabled={loading}>
          Update Profile
        </button>

        {/* SECURITY */}
        <div className="divider">Security</div>

        <div className="field">
          <label>New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>

        <button onClick={changePassword}>
          Change Password
        </button>

        {/* LOGOUT */}
        <button className="danger" onClick={logout}>
          🔒 Logout
        </button>
      </div>
    </div>
  );
}
