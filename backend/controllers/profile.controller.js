import Employee from "../models/epmloyee.js"; 
// Note: Vercel par fs aur path ka use crash de sakta hai agar disk write try karein

/* ================= IMAGE UPLOAD (Vercel Compatible) ================= */
export const uploadProfileImage = async (req, res) => {
  try {
    const { employeeId } = req.body;

    // 1. Validation
    if (!req.file || !employeeId) {
      return res.status(400).json({
        success: false,
        message: "Image file or employeeId missing",
      });
    }

    /**
     * ⚠️ VERCEL WARNING: 
     * Yahan se 'fs.unlinkSync' wala logic hata diya gaya hai kyunki 
     * serverless functions disk storage allow nahi karte.
     */

    // 2. Database Update: Nayi photo ka path save karein
    // Agar Cloudinary use kar rahe hain toh path 'req.file.path' hoga
    const imagePath = req.file.path || `/uploads/${req.file.filename}`;

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
    console.error("Upload Error:", err);
    res.status(500).json({ 
      success: false, 
      message: "Serverless invocation failed: Use Cloudinary for production" 
    });
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