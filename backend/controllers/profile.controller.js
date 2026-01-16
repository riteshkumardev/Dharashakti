import Employee from "../models/epmloyee.js"; 
import fs from "fs";
import path from "path";

/* ================= IMAGE UPLOAD (Fully Updated) ================= */
export const uploadProfileImage = async (req, res) => {
  try {
    const { employeeId } = req.body;

    // 1. Validation: File aur ID check karein
    if (!req.file || !employeeId) {
      return res.status(400).json({
        success: false,
        message: "Image file or employeeId missing",
      });
    }

    // 2. Cleanup: Purani photo delete karne ka robust logic
    const oldEmployee = await Employee.findOne({ employeeId });
    if (oldEmployee && oldEmployee.photo) {
      // Path fix: Pehla slash '/' check karke remove karein
      const relativePath = oldEmployee.photo.startsWith('/') 
        ? oldEmployee.photo.substring(1) 
        : oldEmployee.photo;
        
      const oldFilePath = path.join(process.cwd(), relativePath);
      
      // Cleanup execution
      if (fs.existsSync(oldFilePath)) {
        try {
          fs.unlinkSync(oldFilePath);
        } catch (fileErr) {
          console.error("Cleanup Error:", fileErr.message);
        }
      }
    }

    // 3. Database Update: Nayi photo ka path '/' ke saath save karein
    const imagePath = `/uploads/${req.file.filename}`;

    const employee = await Employee.findOneAndUpdate(
      { employeeId },
      { photo: imagePath },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    res.json({
      success: true,
      message: "✅ Profile image updated successfully",
      photo: imagePath, 
    });
  } catch (err) {
    console.error("Critical Upload Error:", err);
    res.status(500).json({ success: false, message: "Server error: Check uploads folder permissions" });
  }
};

/* ================= UPDATE DETAILS ================= */
export const updateProfile = async (req, res) => {
  try {
    const { employeeId, name, phone } = req.body;

    const employee = await Employee.findOneAndUpdate(
      { employeeId },
      { name, phone },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    res.json({ success: true, message: "✅ Details updated", data: employee });
  } catch (err) {
    res.status(500).json({ success: false, message: "Update failed" });
  }
};

/* ================= CHANGE PASSWORD ================= */
export const changePassword = async (req, res) => {
  try {
    const { employeeId, password } = req.body; 

    if (!password || password.length < 4) {
      return res.status(400).json({ success: false, message: "Min 4 characters required" });
    }

    const employee = await Employee.findOneAndUpdate(
      { employeeId },
      { password: password }, 
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    res.json({ success: true, message: "🔐 Password updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Password update failed" });
  }
};

/* ================= LOGOUT ================= */
export const logoutUser = async (req, res) => {
  try {
    const { employeeId } = req.body;
    await Employee.findOneAndUpdate({ employeeId }, { currentSessionId: null });
    res.json({ success: true, message: "Logged out" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Logout failed" });
  }
};