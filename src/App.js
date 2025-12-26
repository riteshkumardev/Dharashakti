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
import { SnackBar } from "./component/Core_Component/Snackbar/SnackBar";

function App() {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );


  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const db = getDatabase(app);
  const effectRan = useRef(false); // 🔒 React 18 guard

  // ======================================================
  // 🔥 SINGLE GLOBAL FIREBASE LISTENER (SAFE)
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
        localStorage.removeItem("user");
        setUser(null);
        window.location.href = "/login";
        return;
      }

      // 🔐 SESSION CHECK
      if (
        liveData.currentSessionId &&
        liveData.currentSessionId !== user.currentSessionId
      ) {
        alert("⚠️ This ID was logged in on another device.");
        localStorage.removeItem("user");
        setUser(null);
        window.location.href = "/login";
        return;
      }

      // 🔁 SYNC USER DATA (ROLE / NAME / ETC)
      const updatedUser = {
        firebaseId: user.firebaseId,
        ...liveData,
        currentSessionId: user.currentSessionId,
      };

      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    });

    return () => off(userRef);
  }, []); // ✅ EMPTY dependency (important)

  // ======================================================
  // 🔐 Protected Route
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
            <Route path="/profile" element={<ProtectedRoute><Profile user={user} setUser={setUser} /></ProtectedRoute>} />
            <Route path="/attendance" element={<ProtectedRoute><Attendance role={user?user.role:"" }/></ProtectedRoute>} />
            <Route path="/profit-loss" element={<ProtectedRoute><ProfitLoss role={user?user.role:"" } /></ProtectedRoute>} />
            <Route path="/expenses" element={<ProtectedRoute><ExpenseManager role={user?user.role:"" } /></ProtectedRoute>} />
            <Route path="/staff-ledger" element={<ProtectedRoute><EmployeeLedger role={user?user.role:"" }/></ProtectedRoute>} />
            <Route path="/sales-entry" element={<ProtectedRoute><SalesEntry role={user?user.role:"" } /></ProtectedRoute>} />
            <Route path="/sales-table" element={<ProtectedRoute><SalesTable role={user?user.role:"" }/></ProtectedRoute>} />
            <Route path="/purchase-form" element={<ProtectedRoute><PurchaseForm role={user?user.role:"" }/></ProtectedRoute>} />
            <Route path="/purchase-table" element={<ProtectedRoute><PurchaseTable role={user?user.role:"" } /></ProtectedRoute>} />
            <Route path="/employee-table" element={<ProtectedRoute><EmployeeTable role={user?user.role:"" }/></ProtectedRoute>} />
            <Route path="/employee-details/:id" element={<ProtectedRoute><EmployeeDetails role={user?user.role:"" }/></ProtectedRoute>} />
            <Route path="/stock-management" element={<ProtectedRoute><StockManagement role={user?user.role:"" }/></ProtectedRoute>} />
            <Route path="/stock-add" element={<ProtectedRoute><StockAddForm role={user?user.role:"" }/></ProtectedRoute>} />

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
