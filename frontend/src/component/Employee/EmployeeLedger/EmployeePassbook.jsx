import React from 'react';

const EmployeePassbook = ({ selectedEmp, availableMonths, fullAttendanceData, allPayments }) => {

  const calculateMonthStats = (month) => {
    const monthlySalary = Number(selectedEmp.salary) || 0;
    const dayRate = monthlySalary / 30;

    let p = 0, a = 0, h = 0;
    Object.keys(fullAttendanceData).forEach(date => {
      if (date.startsWith(month)) {
        if (fullAttendanceData[date] === "Present") p++;
        else if (fullAttendanceData[date] === "Absent") a++;
        else if (fullAttendanceData[date] === "Half-Day") h++;
      }
    });

    const workedDays = p + (h * 0.5);
    const grossEarned = Math.round(dayRate * workedDays);

    const monthlyAdvance = allPayments
      .filter(pay => pay.date.substring(0, 7) === month)
      .reduce((sum, pay) => sum + Number(pay.amount), 0);

    return {
      monthName: new Date(month + "-01").toLocaleString('default', { month: 'short', year: 'numeric' }),
      workedDays,
      grossEarned,
      monthlyAdvance,
      netPayable: grossEarned - monthlyAdvance
    };
  };

  return (
    <>
      <style>
        {`
          .passbook-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          
          /* 🎨 Header Color Change */
          .passbook-table thead tr {
            background-color: #1e3a8a !important; /* Dark Blue */
            color: white !important;
            -webkit-print-color-adjust: exact; /* Print mein color dikhane ke liye */
          }

          .passbook-table th, .passbook-table td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }

          @media print {
            .no-print { display: none !important; }
            .passbook-table thead tr {
              background-color: #1e3a8a !important;
              color: white !important;
            }
          }
        `}
      </style>

      <div id="printable-container" className="printable-container">
        <div className="passbook-header">
          <h2>Employee Passbook (Ledger)</h2>
          <p>
            Name: <b>{selectedEmp.name}</b> | ID: {selectedEmp.employeeId}
          </p>
        </div>

        <table className="passbook-table">
          <thead  style={{ backgroundColor: '#1e3a8a', color: 'white' }}>
            <tr>
              <th>Month</th>
              <th>Days Worked</th>
              <th>Gross Earned (A)</th>
              <th>Advance Taken (B)</th>
              <th>Net Balance (A-B)</th>
            </tr>
          </thead>
          <tbody>
            {availableMonths.map(month => {
              const data = calculateMonthStats(month);
              if (data.workedDays === 0 && data.monthlyAdvance === 0) return null;

              return (
                <tr key={month}>
                  <td>{data.monthName}</td>
                  <td>{data.workedDays}</td>
                  <td>₹{data.grossEarned.toLocaleString()}</td>
                  <td style={{ color: 'red' }}>- ₹{data.monthlyAdvance.toLocaleString()}</td>
                  <td style={{ fontWeight: 'bold' }}>₹{data.netPayable.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="no-print" style={{ marginTop: '20px' }}>
          <button
            onClick={() => window.print()}
            style={{ 
              cursor: 'pointer', 
              padding: '10px 20px',
              backgroundColor: '#1e3a8a',
              color: 'white',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            Print Passbook
          </button>
        </div>
      </div>
    </>
  );
};

export default EmployeePassbook;