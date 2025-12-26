import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar'; // Install: npm install react-calendar
import 'react-calendar/dist/Calendar.css';
import { getDatabase, ref, onValue } from "firebase/database";
import { app } from "../../../redux/api/firebase/firebase";
import './AttendancePopup.css';
const AttendancePopup = ({ employeeId, onClose }) => {
  const [attendanceData, setAttendanceData] = useState({});
  const db = getDatabase(app);

  useEffect(() => {
    // Firebase se us specific employee ki attendance fetch karein
    const attendanceRef = ref(db, `attendance`);
    onValue(attendanceRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const filteredData = {};
        
        // Data format: { "2023-12-01": { empId: "Present" }, ... }
        Object.keys(data).forEach(date => {
          if (data[date][employeeId]) {
            filteredData[date] = data[date][employeeId].status; // Present/Absent
          }
        });
        setAttendanceData(filteredData);
      }
    });
  }, [employeeId, db]);

  // Calendar ke tiles ko color karne ka function
  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = date.toISOString().split('T')[0];
      if (attendanceData[dateStr] === 'Present') return 'bg-success'; // Green
      if (attendanceData[dateStr] === 'Absent') return 'bg-danger';  // Red
    }
  };

  return (
    <div className="attendance-modal-overlay">
      <div className="attendance-modal-content">
        <div className="modal-header">
          <h3>📅 Attendance History: {employeeId}</h3>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>
        
        <div className="calendar-container">
          <Calendar 
            tileClassName={tileClassName}
            // Customization ke liye aur options add kar sakte hain
          />
        </div>

        <div className="legend">
          <span className="dot green"></span> Present 
          <span className="dot red"></span> Absent
        </div>
      </div>
    </div>
  );
};

export default AttendancePopup;