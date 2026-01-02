import Attendance from "../models/Attendance.js";

export const markAttendance = async (req, res) => {
  try {
    const { employeeId, date, status, name } = req.body;
    const time = new Date().toLocaleTimeString();
    
    // Upsert logic: Agar hazri pehle se hai toh update, nahi toh nayi banaye
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

export const getDailyAttendance = async (req, res) => {
  try {
    const data = await Attendance.find({ date: req.params.date });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

// 💡 Employee Ledger ke liye Monthly Report function
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