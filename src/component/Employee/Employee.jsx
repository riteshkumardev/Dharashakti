import React, { useState } from 'react';
import EmployeeTable from './EmployeeTable';
import EmployeeDetails from './EmployeeDetails';
import EmployeeAdd from './EmployeeAdd';
import Attendance from '../Attendance/Attendance';


const Employee = () => {
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [view, setView] = useState('TABLE'); // 'TABLE' or 'ATTENDANCE'

  return (
    <div className="employee-page-container">
      {/* Agar Details open hai toh Ledger dikhao */}
      {selectedEmployee ? (
        <EmployeeDetails 
          employee={selectedEmployee} 
          onBack={() => setSelectedEmployee(null)} 
        />
      ) : (
        /* Warna Table ya Attendance dikhao */
        <>
          <div className="header-actions" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button className="btn-submit-colored" onClick={() => setView('TABLE')}>📋 List</button>
            <button className="btn-submit-colored" onClick={() => setView('ATTENDANCE')}>📝 Attendance</button>
            <button className="btn-reset-3d" onClick={() => setShowAddForm(!showAddForm)}>
              {showAddForm ? "✖ Close" : "➕ Add Staff"}
            </button>
          </div>

          {showAddForm && <EmployeeAdd />}

          {view === 'ATTENDANCE' ? (
            <Attendance />
          ) : (
            <EmployeeTable 
              onViewDetails={(emp) => setSelectedEmployee(emp)} // 🟢 YEH PROP ZAROORI HAI
            />
          )}
        </>
      )}
    </div>
  );
};

export default Employee;