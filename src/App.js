import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { getDatabase, ref, onValue } from "firebase/database";
import { app } from "./redux/api/firebase/firebase";
import "./App.css";
import { initializeApp } from "firebase/app";

// 📦 Saare Components ka sahi import
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
  // 1. LocalStorage se user uthana
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")) || null);
  const db = getDatabase(app);

  // 2. 🛡️ Live Security & Block Check
  useEffect(() => {
    if (user?.firebaseId) {
      const userStatusRef = ref(db, `employees/${user.firebaseId}`);
      
      // Live listener jo database mein kisi bhi badlav (Role change or Block) ko track karega
      const unsubscribe = onValue(userStatusRef, (snapshot) => {
        const liveData = snapshot.val();
        
        if (liveData?.isBlocked) {
          handleLogout();
          alert("🚫 Your account is deactivated by Admin.");
        } else if (liveData) {
          // Sync live changes (like role or name changes) to state and localstorage
          const updatedUser = { firebaseId: user.firebaseId, ...liveData };
          setUser(updatedUser);
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
      });
      
      return () => unsubscribe();
    }
  }, [user?.firebaseId, db]); // ✅ added db dependency

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  // 🔐 Security Wrapper (Protected Route)
  const ProtectedRoute = ({ children, adminOnly = false }) => {
    if (!user) return <Navigate to="/login" replace />;
    
    if (adminOnly && user.role !== 'Admin') {
      alert("⚠️ Access Denied: This area is for Admins only.");
      return <Navigate to="/" replace />;
    }
    
    return children;
  };

  return (
    <Router>
      <div className="app-container">
        {/* Navbar ko user state pass kar rahe hain taaki login/logout button sync rahe */}
        <Navbar user={user} setUser={setUser} />

        <div className="page-content">
          <Routes>
            {/* 🟢 Public Route: Agar login hai toh home pe bhej do */}
            <Route path="/login" element={!user ? <Login setUser={setUser} /> : <Navigate to="/" />} />

            {/* 🔵 Staff & Workers Routes (Login Required) */}
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

            {/* 🔴 Admin ONLY Routes (Master Panel & Registration) */}
            <Route path="/master-panel" element={
              <ProtectedRoute adminOnly={true}>
                <MasterPanel user={user} />
              </ProtectedRoute>
            } />
            
            {/* Ab naya staff register karna sirf admin ke control mein hai */}
            <Route path="/employee-add" element={
              <ProtectedRoute adminOnly={true}>
                <EmployeeAdd />
              </ProtectedRoute>
            } />

            {/* 🛡️ Fallback: Agar galat URL ho toh home pe bhej do */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;