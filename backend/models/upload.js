import multer from "multer";
import path from "path";
import fs from "fs";

// 📂 Ensure 'uploads/' folder exists manually or via code
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Error handling for directory
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // File name ko unique aur clean banane ke liye
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Original extension (.jpg, .png) barkarar rakhein
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// 🛡️ Security Filters
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true); // Sirf images allow karein
  } else {
    cb(new Error("Only images are allowed!"), false);
  }
};

export default multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // ✅ 2MB Limit (Server stability ke liye)
});