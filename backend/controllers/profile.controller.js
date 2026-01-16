import Employee from "../models/epmloyee.js"; 
import fs from "fs";
import path from "path";

/* ================= IMAGE UPLOAD ================= */
export const uploadProfileImage = async (req, res) => {
  try {
    const { employeeId } = req.body;

    // 1. Validation: Check karein file aur ID dono hain ya nahi
    if (!req.file || !employeeId) {
      return res.status(400).json({
        success: false,
        message: "Image file or employeeId missing",
      });
    }

    // 2. Cleanup: Purana record check karein taaki purani photo storage se delete ho sake
    const oldEmployee = await Employee.findOne({ employeeId });
    if (oldEmployee && oldEmployee.photo) {
      // Relative path ko absolute path mein badlein (uploads/filename.jpg)
      // .substring(1) isliye kyunki path '/uploads/...' slash se shuru hota hai
      const oldFilePath = path.join(process.cwd(), oldEmployee.photo.substring(1));
      
      if (fs.existsSync(oldFilePath)) {
        try {
          fs.unlinkSync(oldFilePath); // File delete logic
        } catch (fileErr) {
          console.error("Purani file delete nahi ho saki:", fileErr);
        }
      }
    }

    // 3. Save: Nayi photo ka path database mein update karein
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
      message: "Profile image updated successfully",
      photo: imagePath, 
    });
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ success: false, message: "Server error during upload" });
  }
};

/* ================= UPDATE PROFILE (DETAILS) ================= */
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

    res.json({ success: true, message: "Profile updated successfully", data: employee });
  } catch (err) {
    res.status(500).json({ success: false, message: "Update failed" });
  }
};

/* ================= CHANGE PASSWORD ================= */
export const changePassword = async (req, res) => {
  try {
    const { employeeId, password } = req.body; 

    if (!password || password.length < 4) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 4 characters",
      });
    }

    const employee = await Employee.findOneAndUpdate(
      { employeeId },
      { password: password }, 
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Password update failed" });
  }
};

/* ================= LOGOUT ================= */
export const logoutUser = async (req, res) => {
  try {
    const { employeeId } = req.body;
    // Session ID ko null karke logout handle karein
    await Employee.findOneAndUpdate({ employeeId }, { currentSessionId: null });
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Logout failed" });
  }
};