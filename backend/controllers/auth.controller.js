import Employee from "../models/epmloyee.js";
/**
 * POST /api/auth/login
 */
// Auth controller mein ye function add karein
export const unlockEmployee = async (req, res) => {
  try {
    const { employeeId, password } = req.body;

    const employee = await Employee.findOne({ employeeId });

    if (!employee || employee.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password",
      });
    }

    res.status(200).json({
      success: true,
      message: "App Unlocked",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
export const loginEmployee = async (req, res) => {
  try {
    const { employeeId, password } = req.body;

    if (!employeeId || !password) {
      return res.status(400).json({
        success: false,
        message: "Employee ID and password required",
      });
    }

    // 🔍 Find employee by employeeId
    const employee = await Employee.findOne({ employeeId });

    if (!employee) {
      return res.status(401).json({
        success: false,
        message: "Invalid Employee ID",
      });
    }

    // 🔒 Block check
    if (employee.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Account is blocked by admin",
      });
    }

    // 🔑 Password check (plain for now)
    if (employee.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password",
      });
    }

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        _id: employee._id,
        employeeId: employee.employeeId,
        name: employee.name,
        role: employee.role,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
