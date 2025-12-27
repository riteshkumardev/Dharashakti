import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { getDatabase, ref, onValue, off } from "firebase/database";
import { app } from "./redux/api/firebase/firebase";
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


function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")) || null);
  const [isLocked, setIsLocked] = useState(false);
  const db = getDatabase(app);
  const effectRan = useRef(false);

  // ======================================================
  // 🔥 FIREBASE REAL-TIME SYNC (Privacy & Security)
  // ======================================================
  useEffect(() => {
    if (effectRan.current) return;
    effectRan.current = true;

    if (!user?.firebaseId) return;

    const userRef = ref(db, `employees/${user.firebaseId}`);

    onValue(userRef, (snapshot) => {
      const liveData = snapshot.val();
      if (!liveData) return;

      // 🚫 Blocked Check
      if (liveData.isBlocked) {
        alert("🚫 Your account is deactivated by Admin.");
        logoutUser();
        return;
      }

      // 🔐 Session Check
      if (liveData.currentSessionId && liveData.currentSessionId !== user.currentSessionId) {
        alert("⚠️ Session Alert: Device logged in elsewhere.");
        logoutUser();
        return;
      }

      // 🔁 Data Sync
      const updatedUser = {
        ...user,
        ...liveData,
      };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    });

    return () => off(userRef);
  }, [user?.firebaseId]);

  const logoutUser = () => {
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/login";
  };

  // ======================================================
  // 🔒 AUTO-LOCK TIMER (Privacy Guard)
  // ======================================================
  useEffect(() => {
    if (!user) return;

    let timeoutId;
    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      // 5 Minute Inactivity Lock
      timeoutId = setTimeout(() => setIsLocked(true), 300000);
    };

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    events.forEach(event => window.addEventListener(event, resetTimer));

    resetTimer();

    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer));
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user]);

  // ======================================================
  // 🛡️ PROTECTED ROUTE (Role-Based Access Control)
  // ======================================================
  const ProtectedRoute = ({ children, adminOnly = false, managerAllowed = false }) => {
    if (!user) return <Navigate to="/login" replace />;

    const isBoss = user.role === "Admin" || user.role === "Manager";

    // Admin Only Pages (Master Panel, etc.)
    if (adminOnly && user.role !== "Admin") {
      alert("⚠️ Restricted: Admin Access Only.");
      return <Navigate to="/" replace />;
    }

    // High Sensitivity Pages (Profit, Expenses, Full Employee List)
    if (managerAllowed && !isBoss) {
      alert("⚠️ Restricted: Management Access Only.");
      return <Navigate to="/" replace />;
    }

    return children;
  };

  return (
    <Router>
      <div className="app-container">
        {/* Screen Lock Overlay */}
        {isLocked && user && <ScreenLock user={user} setIsLocked={setIsLocked} />}

        <Navbar user={user} setUser={setUser} />

        <div className="page-content">
          <Routes>
            {/* --- PUBLIC --- */}
            <Route path="/login" element={!user ? <Login setUser={setUser} /> : <Navigate to="/" />} />

            {/* --- BASIC ACCESS (SABKE LIYE) --- */}
            <Route path="/" element={<ProtectedRoute><Home user={user} /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile user={user} setUser={setUser} /></ProtectedRoute>} />
            
            {/* Yahan user bhej rahe hain taaki staff sirf apni details dekh sake */}
            <Route path="/attendance" element={<ProtectedRoute><Attendance role={user?.role} user={user} /></ProtectedRoute>} />
            <Route path="/staff-ledger" element={<ProtectedRoute><EmployeeLedger role={user?.role} user={user} /></ProtectedRoute>} />

            {/* --- MANAGEMENT ACCESS (ADMIN & MANAGER ONLY) --- */}
            <Route path="/profit-loss" element={<ProtectedRoute managerAllowed><ProfitLoss role={user?.role}/></ProtectedRoute>} />
            <Route path="/expenses" element={<ProtectedRoute managerAllowed><ExpenseManager role={user?.role}/></ProtectedRoute>} />
            <Route path="/sales-entry" element={<ProtectedRoute managerAllowed><SalesEntry role={user?.role}/></ProtectedRoute>} />
            <Route path="/sales-table" element={<ProtectedRoute managerAllowed><SalesTable role={user?.role}/></ProtectedRoute>} />
            <Route path="/purchase-form" element={<ProtectedRoute managerAllowed><PurchaseForm role={user?.role}/></ProtectedRoute>} />
            <Route path="/purchase-table" element={<ProtectedRoute managerAllowed><PurchaseTable role={user?.role}/></ProtectedRoute>} />
            <Route path="/stock-management" element={<ProtectedRoute managerAllowed><StockManagement role={user?.role}/></ProtectedRoute>} />
            <Route path="/stock-add" element={<ProtectedRoute managerAllowed><StockAddForm role={user?.role}/></ProtectedRoute>} />
            
            {/* Employee Management Privacy */}
            <Route path="/employee-table" element={<ProtectedRoute managerAllowed><EmployeeTable role={user?.role}/></ProtectedRoute>} />
            <Route path="/Reports_Printing" element={<ProtectedRoute managerAllowed><Reports_Printing role={user?.role}/></ProtectedRoute>} />
           

            {/* --- SUPER ADMIN ONLY --- */}
            <Route
              path="/master-panel"
              element={<ProtectedRoute adminOnly><MasterPanel user={user} /></ProtectedRoute>}
            />
            <Route
              path="/employee-add"
              element={<ProtectedRoute adminOnly><EmployeeAdd role={user?.role} /></ProtectedRoute>}
            />

            {/* FALLBACK */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;