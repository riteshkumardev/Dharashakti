import Employee from "../models/epmloyee.js"; 

/* ================= IMAGE UPLOAD (Production Ready) ================= */
export const uploadProfileImage = async (req, res) => {
  try {
    const { employeeId } = req.body;

    // 1. Validation: File ya ID missing hone par crash rokne ke liye
    if (!req.file || !employeeId) {
      return res.status(400).json({
        success: false,
        message: "Image file or employeeId missing",
      });
    }

    /**
     * ✅ IMPORTANT: Vercel par local disk par file save (diskStorage) 
     * karne ki koshish hamesha crash degi.
     * Cloudinary use karne par 'req.file.path' seedha 'https://...' URL dega.
     */
    const imagePath = req.file.path; 

    if (!imagePath) {
       return res.status(500).json({ success: false, message: "Storage upload failed" });
    }

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
    console.error("Upload Error:", err.message);
    res.status(500).json({ 
      success: false, 
      message: "Vercel Error: Ensure Cloudinary is configured. Local disk is read-only." 
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