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
import EmployeeDetails from "./component/Employee/EmployeeDetails";
import EmployeeLedger from "./component/Employee/EmployeeLedger/EmployeeLedger";
import StockManagement from "./component/Stocks/StockManagement";
import StockAddForm from "./component/Stocks/StockAddForm";
import Attendance from "./component/Employee/Attendance/Attendance";
import ExpenseManager from "./component/Employee/ExpenseManager/ExpenseManager";
import MasterPanel from "./component/MasterPanel/MasterPanel";
import ProfitLoss from "./component/ProfitLoss/ProfitLoss";
import Profile from "./component/Profile/Profile";
import ScreenLock from "./component/Core_Component/ScreenLock/ScreenLocl";


function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")) || null);
  const [isLocked, setIsLocked] = useState(false); // Lock state
  const db = getDatabase(app);
  const effectRan = useRef(false);

  // ======================================================
  // 🔥 FIREBASE LISTENER (Block & Session Check)
  // ======================================================
  useEffect(() => {
    if (effectRan.current) return;
    effectRan.current = true;

    if (!user?.firebaseId) return;

    const userRef = ref(db, `employees/${user.firebaseId}`);
    onValue(userRef, (snapshot) => {
      const liveData = snapshot.val();
      if (!liveData) return;

      // 🚫 BLOCK CHECK
      if (liveData.isBlocked) {
        alert("🚫 Your account is deactivated by Admin.");
        logoutUser();
        return;
      }

      // 🔐 SESSION CHECK
      if (liveData.currentSessionId && liveData.currentSessionId !== user.currentSessionId) {
        alert("⚠️ This ID was logged in on another device.");
        logoutUser();
        return;
      }

      // 🔁 SYNC DATA
      const updatedUser = { ...user, ...liveData };
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
  // 🔒 IDLE TIMER (Screen Lock Logic)
  // ======================================================
  useEffect(() => {
    if (!user) return;

    let timeoutId;
    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      // 5 Minute (300000ms) inactive rehne par lock hoga
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
  // 🔐 Protected Route Wrapper
  // ======================================================
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
        
        {/* 🔒 Screen Lock Overlay (Jab isLocked true ho tab dikhega) */}
        {isLocked && user && (
          <ScreenLock user={user} setIsLocked={setIsLocked} />
        )}
        

        <Navbar user={user} setUser={setUser} />

        <div className="page-content">
          <Routes>
            <Route
              path="/login"
              element={!user ? <Login setUser={setUser} /> : <Navigate to="/" />}
            />

            {/* PROTECTED ROUTES - Prop pass as user?.role */}
            <Route path="/" element={<ProtectedRoute><Home user={user} /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile user={user} setUser={setUser} /></ProtectedRoute>} />
            
            <Route path="/attendance" element={<ProtectedRoute><Attendance role={user?.role}/></ProtectedRoute>} />
            <Route path="/profit-loss" element={<ProtectedRoute><ProfitLoss role={user?.role}/></ProtectedRoute>} />
            <Route path="/expenses" element={<ProtectedRoute><ExpenseManager role={user?.role}/></ProtectedRoute>} />
            <Route path="/staff-ledger" element={<ProtectedRoute><EmployeeLedger role={user?.role}/></ProtectedRoute>} />
            <Route path="/sales-entry" element={<ProtectedRoute><SalesEntry role={user?.role}/></ProtectedRoute>} />
            <Route path="/sales-table" element={<ProtectedRoute><SalesTable role={user?.role}/></ProtectedRoute>} />
            <Route path="/purchase-form" element={<ProtectedRoute><PurchaseForm role={user?.role}/></ProtectedRoute>} />
            <Route path="/purchase-table" element={<ProtectedRoute><PurchaseTable role={user?.role}/></ProtectedRoute>} />
            <Route path="/employee-table" element={<ProtectedRoute><EmployeeTable role={user?.role}/></ProtectedRoute>} />
            <Route path="/employee-details/:id" element={<ProtectedRoute><EmployeeDetails role={user?.role}/></ProtectedRoute>} />
            <Route path="/stock-management" element={<ProtectedRoute><StockManagement role={user?.role}/></ProtectedRoute>} />
            <Route path="/stock-add" element={<ProtectedRoute><StockAddForm role={user?.role}/></ProtectedRoute>} />

            {/* ADMIN ONLY ROUTES */}
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
                  <EmployeeAdd role={user?.role} />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;