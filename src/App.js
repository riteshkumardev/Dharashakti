import React, { useState, useEffect } from "react";
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
import EmployeeDetails from "./component/Employee/EmployeeDetails";
import EmployeeLedger from "./component/EmployeeLedger/EmployeeLedger";
import StockManagement from "./component/Stocks/StockManagement";
import StockAddForm from "./component/Stocks/StockAddForm";
import Attendance from "./component/Attendance/Attendance";
import ExpenseManager from "./component/ExpenseManager/ExpenseManager";
import MasterPanel from "./component/MasterPanel/MasterPanel";
import ProfitLoss from "./component/ProfitLoss/ProfitLoss";

function App() {
  // 🔐 User state
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );

  const db = getDatabase(app);

  // ======================================================
  // 🔥 GLOBAL SESSION GUARD (ONE ID → ONE LOGIN)
  // ======================================================
  useEffect(() => {
    if (!user?.firebaseId || !user?.currentSessionId) return;

    const sessionRef = ref(
      db,
      `employees/${user.firebaseId}/currentSessionId`
    );

    onValue(sessionRef, (snapshot) => {
      const activeSessionId = snapshot.val();

      // 🔥 SAME ID logged in somewhere else
      if (activeSessionId !== user.currentSessionId) {
        alert("⚠️ This ID was logged in on another device.");
        localStorage.removeItem("user");
        setUser(null);
        window.location.href = "/login"; // hard redirect (important)
      }
    });

    return () => off(sessionRef);
  }, [user, db]);

  // ======================================================
  // 🛡️ LIVE BLOCK / ROLE CHANGE CHECK
  // ======================================================
  useEffect(() => {
    if (!user?.firebaseId) return;

    const userStatusRef = ref(db, `employees/${user.firebaseId}`);

    onValue(userStatusRef, (snapshot) => {
      const liveData = snapshot.val();

      if (!liveData) return;

      if (liveData.isBlocked) {
        alert("🚫 Your account is deactivated by Admin.");
        localStorage.removeItem("user");
        setUser(null);
        window.location.href = "/login";
      } else {
        // 🔁 Sync live updates (role, name, etc.)
        const updatedUser = {
          firebaseId: user.firebaseId,
          ...liveData,
          currentSessionId: user.currentSessionId, // preserve session
        };

        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    });

    return () => off(userStatusRef);
  }, [user?.firebaseId, db]);

  // 🔐 Protected Route Wrapper
  const ProtectedRoute = ({ children, adminOnly = false }) => {
    if (!user) return <Navigate to="/login" replace />;

    if (adminOnly && user.role !== "Admin") {
      alert("⚠️ Access Denied: Admins only.");
      return <Navigate to="/" replace />;
    }

    return children;
  };

  return (
    <Router>
      <div className="app-container">
        <Navbar user={user} setUser={setUser} />

        <div className="page-content">
          <Routes>
            {/* PUBLIC */}
            <Route
              path="/login"
              element={!user ? <Login setUser={setUser} /> : <Navigate to="/" />}
            />

            {/* PROTECTED */}
            <Route path="/" element={<ProtectedRoute><Home user={user} /></ProtectedRoute>} />
            <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
            <Route path="/profit-loss" element={<ProtectedRoute><ProfitLoss /></ProtectedRoute>} />
            <Route path="/expenses" element={<ProtectedRoute><ExpenseManager /></ProtectedRoute>} />
            <Route path="/staff-ledger" element={<ProtectedRoute><EmployeeLedger /></ProtectedRoute>} />
            <Route path="/sales-entry" element={<ProtectedRoute><SalesEntry /></ProtectedRoute>} />
            <Route path="/sales-table" element={<ProtectedRoute><SalesTable /></ProtectedRoute>} />
            <Route path="/purchase-form" element={<ProtectedRoute><PurchaseForm /></ProtectedRoute>} />
            <Route path="/purchase-table" element={<ProtectedRoute><PurchaseTable /></ProtectedRoute>} />
            <Route path="/employee-table" element={<ProtectedRoute><EmployeeTable /></ProtectedRoute>} />
            <Route path="/employee-details/:id" element={<ProtectedRoute><EmployeeDetails /></ProtectedRoute>} />
            <Route path="/stock-management" element={<ProtectedRoute><StockManagement /></ProtectedRoute>} />
            <Route path="/stock-add" element={<ProtectedRoute><StockAddForm /></ProtectedRoute>} />

            {/* ADMIN ONLY */}
            <Route
              path="/master-panel"
              element={
                <ProtectedRoute adminOnly>
                  <MasterPanel user={user} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employee-add"
              element={
                <ProtectedRoute adminOnly>
                  <EmployeeAdd />
                </ProtectedRoute>
              }
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
