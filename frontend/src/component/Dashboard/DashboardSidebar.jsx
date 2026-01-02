import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DashboardSidebar.css";

const DashboardSidebar = ({ closeSidebar }) => {
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(null);

  const handleNavigate = (path) => {
    navigate(path);
    if (closeSidebar) closeSidebar();
  };

  const toggleMenu = (menuName) => {
    setOpenMenu(openMenu === menuName ? null : menuName);
  };

  // ✅ Fixed style logic (camelCase and logic fix)
  const getTitleStyle = (menuName) => ({
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between", // Fixed from justify-content
    alignItems: "center",
    padding: "12px 15px",
    borderRadius: "10px",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    background: openMenu === menuName ? "rgba(255, 255, 255, 0.15)" : "transparent",
    marginBottom: "8px",
    fontWeight: "600",
    border: openMenu === menuName ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid transparent",
    color: openMenu === menuName ? "#fff" : "rgba(255, 255, 255, 0.8)",
  });

  return (
    <div className="dashboard-sidebar" style={{ padding: "15px", overflowY: "auto", height: "100%" }}>
      
      {/* 🟢 GROUP 1: SALES & BILLING */}
      <div className="sidebar-section">
        <div 
          className="sidebar-title action-button" 
          style={getTitleStyle("sales")}
          onClick={() => toggleMenu("sales")}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "18px" }}>📊</span> Sales & Billing
          </span>
          <span style={{ fontSize: "12px", opacity: 0.7 }}>
            {openMenu === "sales" ? "▲" : "▼"}
          </span>
        </div>
        {openMenu === "sales" && (
          <ul className="sidebar-list" style={{ paddingLeft: "15px", animation: "slideIn 0.3s ease" }}>
            <li onClick={() => handleNavigate("/sales-entry")}>➤ Sales Entry</li>
            <li onClick={() => handleNavigate("/sales-table")}>➤ Sales Table</li>
          </ul>
        )}
      </div>

      {/* 🔵 GROUP 2: INVENTORY & STOCKS */}
      <div className="sidebar-section">
        <div 
          className="sidebar-title action-button" 
          style={getTitleStyle("stock")}
          onClick={() => toggleMenu("stock")}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "18px" }}>📦</span> Inventory
          </span>
          <span style={{ fontSize: "12px", opacity: 0.7 }}>
            {openMenu === "stock" ? "▲" : "▼"}
          </span>
        </div>
        {openMenu === "stock" && (
          <ul className="sidebar-list" style={{ paddingLeft: "15px" }}>
            <li onClick={() => handleNavigate("/stock-management")}>➤ Stock View</li>
            <li onClick={() => handleNavigate("/stock-add")}>➤ Add New Stock</li>
            {/* <li onClick={() => handleNavigate("/purchase-form")}>➤ Purchase Entry</li>
            <li onClick={() => handleNavigate("/purchase-table")}>➤ Purchase Table</li> */}
          </ul>
        )}
      </div>

      {/* 🟠 GROUP 3: STAFF & ATTENDANCE */}
      <div className="sidebar-section">
        <div 
          className="sidebar-title action-button" 
          style={getTitleStyle("staff")}
          onClick={() => toggleMenu("staff")}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "18px" }}>👥</span> Staff Control
          </span>
          <span style={{ fontSize: "12px", opacity: 0.7 }}>
            {openMenu === "staff" ? "▲" : "▼"}
          </span>
        </div>
        {openMenu === "staff" && (
          <ul className="sidebar-list" style={{ paddingLeft: "15px" }}>
            <li onClick={() => handleNavigate("/employee-table")}>➤ Employee List</li>
            <li onClick={() => handleNavigate("/employee-add")}>➤ Add Employee</li>
            <li onClick={() => handleNavigate("/attendance")}>➤ Attendance</li>
            <li onClick={() => handleNavigate("/staff-ledger")}>➤ Employee Ledger</li>
          </ul>
        )}
      </div>

      {/* 🔴 GROUP 4: FINANCE & ANALYTICS */}
      <div className="sidebar-section">
        <div 
          className="sidebar-title action-button" 
          style={getTitleStyle("finance")}
          onClick={() => toggleMenu("finance")}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "18px" }}>💰</span> Finance Reports
          </span>
          <span style={{ fontSize: "12px", opacity: 0.7 }}>
            {openMenu === "finance" ? "▲" : "▼"}
          </span>
        </div>
        {openMenu === "finance" && (
          <ul className="sidebar-list" style={{ paddingLeft: "15px" }}>
            <li onClick={() => handleNavigate("/expenses")}>➤ Expenses</li>
            <li onClick={() => handleNavigate("/profit-loss")}>➤ Profit & Loss</li>
            <li onClick={() => handleNavigate("/Reports_Printing")}>➤ Reports & Printing</li>
          </ul>
        )}
      </div>

    </div>
  );
};

export default DashboardSidebar;