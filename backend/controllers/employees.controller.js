import Employee from "../models/epmloyee.js"; 
import ActivityLog from "../models/activityLog.js";

/**
 * ✅ 1. Get All Employees
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
 * ✅ 2. Master Update: Update ALL Employee Details
 * समस्या: पहले सिर्फ role और isBlocked अपडेट हो रहा था। अब सब कुछ अपडेट होगा।
 */
export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params; // यहाँ हम URL से ID ले रहे हैं
    const updateData = req.body;

    // सुरक्षा के लिए: employeeId को मैन्युअली बदलने से रोकें
    delete updateData.employeeId;

    // { new: true } अपडेट के बाद नया डेटा रिटर्न करता है
    // runValidators: true स्कीमा के नियमों (Enum, Length) को चेक करता है
    const updatedEmployee = await Employee.findOneAndUpdate(
      { $or: [{ _id: id }, { employeeId: id }] }, // यह _id या employeeId दोनों को सपोर्ट करेगा
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    // एक्टिविटी लॉग रिकॉर्ड करें
    await ActivityLog.create({
      adminName: updateData.adminName || "Admin",
      action: `Profile Updated for ${updatedEmployee.name}`,
      targetEmployeeId: updatedEmployee.employeeId
    });

    res.status(200).json({ success: true, data: updatedEmployee });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message.includes('enum') ? "Invalid Role/Designation" : "Update failed" 
    });
  }
};

/**
 * ✅ 3. Delete Employee
 */
export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Employee.findByIdAndDelete(id);
    
    if (!deleted) return res.status(404).json({ success: false, message: "Not found" });

    res.status(200).json({ success: true, message: "Employee Deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Delete failed" });
  }
};

/**
 * ✅ 4. Create New Employee
 */
export const createEmployee = async (req, res) => {
  try {
    const data = req.body;

    // पक्का करें कि सैलरी नंबर है
    if(data.salary) data.salary = Number(data.salary);

    const existing = await Employee.findOne({ aadhar: data.aadhar });
    if (existing) {
      return res.status(409).json({ success: false, message: "Aadhar already exists" });
    }

    // Employee ID Generation
    let employeeId;
    let exists = true;
    while (exists) {
      employeeId = Math.floor(10000000 + Math.random() * 90000000).toString();
      exists = await Employee.findOne({ employeeId });
    }

    const employee = await Employee.create({
      ...data,
      employeeId,
      role: data.role || data.designation || "Worker", 
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
    res.status(500).json({ 
      success: false, 
      message: error.name === 'ValidationError' ? error.message : "Server error" 
    });
  }
};