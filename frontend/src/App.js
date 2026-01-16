import React, { useState, useEffect } from "react";
// ✅ Changed BrowserRouter to MemoryRouter to hide URL paths
import { MemoryRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

// Components
import Navbar from "./component/Navhtml";
import Login from "./component/Login";
import Home from "./component/Home";
import SalesEntry from "./component/Sales/SalesEntry";
import SalesTable from "./component/Sales/SalesTable";
import PurchaseTable from "./component/Purchase/PurchaseTable";
import PurchaseForm from "./component/Purchase/PurchaseForm";
import EmployeeTable from "./component/Employee/EmployeeTable";
import EmployeeAdd from "./component/Employee/EmployeeAdd";
import EmployeeLedger from "./component/Employee/EmployeeLedger/EmployeeLedger";
import StockManagement from "./component/Stocks/StockManagement";
import StockAddForm from "./component/Stocks/StockAddForm";
import Attendance from "./component/Employee/Attendance/Attendance";
import ExpenseManager from "./component/Employee/ExpenseManager/ExpenseManager";
import MasterPanel from "./component/MasterPanel/MasterPanel";
import ProfitLoss from "./component/ProfitLoss/ProfitLoss";
import Profile from "./component/Profile/Profile";
import ScreenLock from "./component/Core_Component/ScreenLock/ScreenLocl";
import Reports_Printing from "./component/Reports_Printing/Reports_Printing";

import InvoicePage from "./component/Invoice/InvoicePage";
import SupplierManager from "./component/Supplier/SupplierManager";

function App() {
  // ✅ SAFE localStorage read (NO JSON crash)
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const [isLocked, setIsLocked] = useState(false);

  // ======================================================
  // 🔒 AUTO-LOCK TIMER (same logic, Firebase removed)
  // ======================================================
  useEffect(() => {
    if (!user) return;

    let timeoutId;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setIsLocked(true), 300000); // 5 min
    };

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetTimer));

    resetTimer();

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user]);

  // ✅ Adjusted logout for MemoryRouter (Internal navigation)
  const logoutUser = () => {
    localStorage.removeItem("user");
    setUser(null);
    // Note: Since URL doesn't change, we don't need window.location.href
  };

  // ======================================================
  // 🛡️ PROTECTED ROUTE (unchanged logic)
  // ======================================================
  const ProtectedRoute = ({ children, adminOnly = false, managerAllowed = false }) => {
    if (!user) return <Navigate to="/login" replace />;

    const isBoss = user.role === "Admin" || user.role === "Manager";

    if (adminOnly && user.role !== "Admin") {
      alert("⚠️ Restricted: Admin Access Only.");
      return <Navigate to="/" replace />;
    }

    if (managerAllowed && !isBoss) {
      alert("⚠️ Restricted: Management Access Only.");
      return <Navigate to="/" replace />;
    }

    return children;
  };

  const sampleEwayData = {
    ewayBillNo: "871615409896",
    generatedDate: "11/12/2025 03:12 PM",
    validUpto: "13/12/2025",
    mode: "Road",
    distance: "242 km",
    transactionType: "Outward - Supply",
    from: {
      gstin: "10DZTPM1457E1ZE",
      name: "M/S DHARA SHAKTI AGRO PRODUCTS",
      address: "Samastipur, BIHAR-848117"
    },
    to: {
      gstin: "10CLTPS3951E1ZY",
      name: "Kranti Food",
      address: "Kasba, BIHAR-854330"
    },
    goods: [
      {
        hsn: "11031300",
        name: "CORN GRITS",
        qty: "16500 KGS",
        taxableAmount: 462000,
        taxRate: "0%"
      }
    ],
    taxSummary: {
      taxable: 462000,
      cgst: 0,
      sgst: 0,
      igst: 0,
      total: 462000
    },
    transport: {
      docNo: "162",
      docDate: "11/12/2025"
    },
    vehicle: {
      vehicleNo: "BR01GE0166",
      enteredFrom: "Samastipur"
    }
  };

  return (
    <Router>
      <div className="app-container">
        {/* Screen Lock Overlay */}
        {isLocked && user && <ScreenLock user={user} setIsLocked={setIsLocked} />}

        <Navbar user={user} setUser={setUser} />

        <div className="page-content">
          <Routes>
            {/* PUBLIC */}
            <Route
              path="/login"
              element={!user ? <Login setUser={setUser} /> : <Navigate to="/" />}
            />

            {/* BASIC */}
            <Route path="/" element={<ProtectedRoute><Home user={user} /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile user={user} setUser={setUser} /></ProtectedRoute>} />
            <Route path="/attendance" element={<ProtectedRoute><Attendance role={user?.role} user={user} /></ProtectedRoute>} />
            <Route path="/staff-ledger" element={<ProtectedRoute><EmployeeLedger role={user?.role} user={user} /></ProtectedRoute>} />
            <Route path="/invoice" element={<ProtectedRoute><InvoicePage role={user?.role} user={user}/></ProtectedRoute>} />

            {/* MANAGEMENT */}
            <Route path="/profit-loss" element={<ProtectedRoute managerAllowed><ProfitLoss role={user?.role} /></ProtectedRoute>} />
            <Route path="/expenses" element={<ProtectedRoute managerAllowed><ExpenseManager role={user?.role} /></ProtectedRoute>} />
            <Route path="/sales-entry" element={<ProtectedRoute managerAllowed><SalesEntry role={user?.role} /></ProtectedRoute>} />
            <Route path="/sales-table" element={<ProtectedRoute managerAllowed><SalesTable role={user?.role} /></ProtectedRoute>} />
            <Route path="/purchase-form" element={<ProtectedRoute managerAllowed><PurchaseForm role={user?.role} /></ProtectedRoute>} />
            <Route path="/purchase-table" element={<ProtectedRoute managerAllowed><PurchaseTable role={user?.role} /></ProtectedRoute>} />
            <Route path="/stock-management" element={<ProtectedRoute managerAllowed><StockManagement role={user?.role} /></ProtectedRoute>} />
            <Route path="/stock-add" element={<ProtectedRoute managerAllowed><StockAddForm role={user?.role} /></ProtectedRoute>} />
            <Route path="/employee-table" element={<ProtectedRoute managerAllowed><EmployeeTable role={user?.role} /></ProtectedRoute>} />
            <Route path="/Reports_Printing" element={<ProtectedRoute managerAllowed><Reports_Printing role={user?.role} /></ProtectedRoute>} />
            <Route path="/suppliers" element={<ProtectedRoute managerAllowed><SupplierManager role={user?.role} /></ProtectedRoute>} />

            {/* ADMIN ONLY */}
            <Route path="/master-panel" element={<ProtectedRoute adminOnly><MasterPanel user={user} /></ProtectedRoute>} />
            <Route path="/employee-add" element={<ProtectedRoute adminOnly><EmployeeAdd role={user?.role} /></ProtectedRoute>} />

            {/* FALLBACK */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;