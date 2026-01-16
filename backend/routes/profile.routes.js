import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  uploadProfileImage,
  updateProfile,
  changePassword,
  logoutUser,
} from "../controllers/profile.controller.js";

const router = express.Router();

/* ================= MULTER CONFIG ================= */
// Ensure 'uploads/' folder exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Unique name with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB Limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed"), false);
    }
  }
});

/* ================= ROUTES (Synced with Frontend) ================= */

// 1. Photo Upload (POST)
router.post("/upload", upload.single("photo"), uploadProfileImage);

// 2. Profile Details Update (PUT - as per your Frontend fetch call)
router.put("/update", updateProfile); 

// 3. Password Change (PUT - as per your Frontend fetch call)
router.put("/password", changePassword);

// 4. Logout (POST)
router.post("/logout", logoutUser);

export default router;