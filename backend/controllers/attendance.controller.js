import Attendance from "../models/Attendance.js";
import Employee from "../models/epmloyee.js"; // ✨ Employee model import karna zaroori hai

// 1️⃣ Mark Single Attendance
export const markAttendance = async (req, res) => {
  try {
    const { employeeId, date, status, name } = req.body;
    const time = new Date().toLocaleTimeString();
    
    const record = await Attendance.findOneAndUpdate(
      { employeeId, date },
      { status, time, name },
      { upsert: true, new: true }
    );
    
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2️⃣ 🆕 Mark Bulk Attendance (Fixes 404 Error)
export const markBulkAttendance = async (req, res) => {
  try {
    const { employeeIds, startDate, endDate, status } = req.body;

    if (!employeeIds || !startDate || !endDate || !status) {
      return res.status(400).json({ success: false, message: "Sabhi fields zaroori hain." });
    }

    // Date range calculate karne ka logic
    let start = new Date(startDate);
    let end = new Date(endDate);
    let dateList = [];

    while (start <= end) {
      dateList.push(new Date(start).toISOString().split('T')[0]);
      start.setDate(start.getDate() + 1);
    }

    // 🔄 Har selected employee aur har date par hazri bharein
    for (const empId of employeeIds) {
      // Name fetch karna taaki ledger mein sahi dikhe
      const employee = await Employee.findOne({ employeeId: empId });
      if (!employee) continue;

      for (const dateStr of dateList) {
        await Attendance.findOneAndUpdate(
          { employeeId: empId, date: dateStr },
          { 
            name: employee.name, 
            status: status, 
            date: dateStr,
            time: "Bulk Entry" 
          },
          { upsert: true }
        );
      }
    }

    res.json({ 
      success: true, 
      message: `${employeeIds.length} employees ki hazri ${dateList.length} dino ke liye mark ho gayi! ✅` 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3️⃣ Get Daily Attendance
export const getDailyAttendance = async (req, res) => {
  try {
    const data = await Attendance.find({ date: req.params.date });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

// 4️⃣ Monthly Report
export const getEmployeeMonthlyReport = async (req, res) => {
  try {
    const data = await Attendance.find({ employeeId: req.params.empId });
    const report = {};
    data.forEach(item => { report[item.date] = item.status; });
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};