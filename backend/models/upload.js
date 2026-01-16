import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

// ☁️ Cloudinary Configuration (Inhe apne Cloudinary Dashboard se bharein)
cloudinary.config({
  cloud_name: "your_cloud_name", 
  api_key: "your_api_key",
  api_secret: "your_api_secret",
});

// 📂 Vercel compatible storage (No local folder needed)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "dharashakti_uploads", // Cloudinary mein folder ka naam
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

// 🛡️ Filter & Limits
export default multer({ 
  storage,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB Limit
});