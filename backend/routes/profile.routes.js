import express from "express";
import multer from "multer";
import {
  uploadProfileImage,
  updateProfile,
  changePassword,
  logoutUser,
} from "../controllers/profile.controller.js";

const router = express.Router();

/* ================= MULTER CONFIG ================= */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    // File name ko unique banane ke liye timestamp use kiya hai
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

/* ================= ROUTES ================= */

// ⚠️ FIX: "image" ko badal kar "photo" kiya gaya hai taaki frontend ke FormData se match ho
router.post("/upload", upload.single("photo"), uploadProfileImage);

// Profile details update karne ke liye
router.post("/update", updateProfile); 

// 🔐 FIX: Password update route ko frontend ke call se match kiya gaya hai
router.post("/change-password", changePassword);

// Logout logic
router.post("/logout", logoutUser);

export default router;