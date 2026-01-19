import Employee from "../models/epmloyee.js"; // Fixed typo to match your file name
import ActivityLog from "../models/activityLog.js";

/**   
 * ✅ 1. Get All Employees for Master Panel
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
 * ✅ 2. Admin Update: Change Role or Block Status
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

    // Record admin activity
    await ActivityLog.create({
      adminName: adminName || "Admin",
      action: `Updated ${updatedEmployee.name}: Role to ${role}, Blocked: ${isBlocked}`,
      targetEmployeeId: employeeId
    });

    res.status(200).json({ success: true, data: updatedEmployee });
  } catch (error) {
    res.status(500).json({ success: false, message: "Update failed" });
  }
};
export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    await Employee.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Employee Deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Delete failed" });
  }
};

/**
 * ✅ 3. Create New Employee (Registration)
 */
export const createEmployee = async (req, res) => {
  try {
    const {
      name, fatherName, phone, emergencyPhone, aadhar, address,
      designation, joiningDate, salary, bankName, accountNo,
      ifscCode, photo, password, role
    } = req.body;

    if (!name || !aadhar || !salary || !password) {
      return res.status(400).json({ success: false, message: "Required fields missing" });
    }

    const existing = await Employee.findOne({ aadhar });
    if (existing) {
      return res.status(409).json({ success: false, message: "Aadhar already exists" });
    }

    let employeeId;
    let exists = true;
    while (exists) {
      employeeId = Math.floor(10000000 + Math.random() * 90000000).toString();
      exists = await Employee.findOne({ employeeId });
    }

    const employee = await Employee.create({
      employeeId, name, fatherName, phone, emergencyPhone, aadhar,
      address, designation, joiningDate, salary, bankName,
      accountNo, ifscCode, photo, password,
      // FIX: Use the designation as the role if role is not provided
      role: role || designation || "Worker", 
      isBlocked: false,
    });

    res.status(201).json({
      success: true,
      message: "Employee registered successfully",
      employeeId: employee.employeeId,
      data: employee,
    });
  } catch (error) {
    console.error("Employee Create Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};