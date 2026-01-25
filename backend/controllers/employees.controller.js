import Employee from "../models/epmloyee.js"; 
import ActivityLog from "../models/activityLog.js";
import bcrypt from "bcryptjs"; // Password security ke liye

/**
 * ✅ 1. CREATE: Naya Employee Registration (With Security)
 */
export const createEmployee = async (req, res) => {
  try {
    const {
      name, aadhar, salary, password, role, designation
    } = req.body;

    // Validation
    if (!name || !aadhar || !salary || !password) {
      return res.status(400).json({ success: false, message: "Required fields missing" });
    }

    // Check Duplicate Aadhar
    const existing = await Employee.findOne({ aadhar });
    if (existing) {
      return res.status(409).json({ success: false, message: "Aadhar already exists" });
    }

    // 🔒 Password Hashing (Security Update)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Unique Employee ID Generator
    let employeeId;
    let exists = true;
    while (exists) {
      employeeId = Math.floor(10000000 + Math.random() * 90000000).toString();
      exists = await Employee.findOne({ employeeId });
    }

    const employee = await Employee.create({
      ...req.body,
      employeeId,
      password: hashedPassword, // Secure password
      salary: Number(salary),
      role: role || designation || "Worker", 
      isBlocked: false,
    });

    res.status(201).json({
      success: true,
      message: "Employee registered successfully ✅",
      employeeId: employee.employeeId,
      data: employee
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error: " + error.message });
  }
};

/**
 * ✅ 2. READ: Get All Employees
 */
export const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: employees });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching employees" });
  }
};

/**
 * ✅ 3. UPDATE: Admin Control (Role/Block Status)
 */
export const updateEmployeeStatus = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { role, isBlocked, adminName } = req.body;

    const updatedEmployee = await Employee.findOneAndUpdate(
      { employeeId: employeeId },
      { role, isBlocked },
      { new: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    // Record Activity Log
    await ActivityLog.create({
      adminName: adminName || "Admin",
      action: `Update: ${updatedEmployee.name} -> Role: ${role}, Blocked: ${isBlocked}`,
      targetEmployeeId: employeeId
    });

    res.status(200).json({ success: true, data: updatedEmployee });
  } catch (error) {
    res.status(500).json({ success: false, message: "Update failed" });
  }
};

/**
 * ✅ 4. DELETE: Remove Employee
 */
export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findByIdAndDelete(id);
    
    if (!employee) {
        return res.status(404).json({ success: false, message: "Employee not found" });
    }

    res.status(200).json({ success: true, message: "Employee Deleted Successfully 🗑️" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Delete failed" });
  }
};