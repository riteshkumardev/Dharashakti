import React, { useState, useEffect } from "react";
import "./Sales.css";
import {
  getDatabase,
  ref,
  push,
  set,
  query,
  limitToLast,
  onValue,
} from "firebase/database";
import { app } from "../../redux/api/firebase/firebase";

// 🏗️ Core Components Import (Aapke project ke hisab se)
import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

const SalesEntry = ({ role }) => {
  const db = getDatabase(app);

  // 🔐 Permission Check
  const isAuthorized = role === "Admin" || role === "Accountant";

  const initialState = {
    date: new Date().toISOString().split("T")[0],
    customerName: "",
    productName: "",
    billNo: "",
    quantity: "",
    rate: "",
    totalPrice: 0,
    amountReceived: "",
    paymentDue: 0,
    remarks: "",
    billDueDate: "",
  };

  const [formData, setFormData] = useState(initialState);
  const [nextSi, setNextSi] = useState(1);
  const [loading, setLoading] = useState(false);

  /* 🔔 Snackbar State (Modern Alert) */
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showMsg = (msg, type = "success") => {
    setSnackbar({ open: true, message: msg, severity: type });
  };

  // 1️⃣ Live SI No Fetching (Wahi purana logic)
  useEffect(() => {
    const salesRef = query(ref(db, "sales"), limitToLast(1));
    const unsubscribe = onValue(salesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const lastEntry = Object.values(data)[0];
        const lastSi = Number(lastEntry.si) || 0;
        setNextSi(lastSi + 1);
      } else {
        setNextSi(1);
      }
    });
    return () => unsubscribe();
  }, [db]);

  // 2️⃣ Live Calculations (Quantity * Rate & 15-Day Due Date logic)
  useEffect(() => {
    const total = (Number(formData.quantity) || 0) * (Number(formData.rate) || 0);
    const due = total - (Number(formData.amountReceived) || 0);

    let calculatedDueDate = "";
    if (formData.date) {
      const d = new Date(formData.date);
      d.setDate(d.getDate() + 15);
      calculatedDueDate = d.toISOString().split("T")[0];
    }

    setFormData((prev) => ({
      ...prev,
      totalPrice: total,
      paymentDue: due,
      billDueDate: calculatedDueDate,
    }));
  }, [
    formData.quantity,
    formData.rate,
    formData.amountReceived,
    formData.date,
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFormData(initialState);
    if (isAuthorized) showMsg("Form cleared", "info");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 🛑 Extra security check
    if (!isAuthorized) {
      showMsg("Unauthorized: Permission Denied!", "error");
      return;
    }

    setLoading(true); // 🔄 Full Screen Loader On

    try {
      const salesRef = ref(db, "sales");
      const newSaleRef = push(salesRef);

      await set(newSaleRef, {
        ...formData,
        si: nextSi,
        timestamp: Date.now(),
      });

      // ✅ Modern Notification
      showMsg(`Sale Saved! SI No: ${nextSi} | Due: ${formData.billDueDate}`, "success");

      handleReset();
    } catch (error) {
      console.error(error);
      showMsg("Data save nahi ho paya. Please try again.", "error");
    } finally {
      // Small delay for smooth transition
      setTimeout(() => setLoading(false), 500);
    }
  };

  return (
    <div className="sales-container">
      {/* 🔄 Global Loader Integration */}
      {loading && <Loader />}

      <div className="sales-card-wide">
        <div className="form-header-flex" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 className="form-title">Sales Entry (Cloud)</h2>

          <div style={{ display: "flex", gap: "10px" }}>
            <div className="si-badge">SI No: {nextSi}</div>
            <div className="due-badge">Due: {formData.billDueDate}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="sales-form-grid">
          <div className="input-group">
            <label>Date</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} disabled={loading || !isAuthorized} />
          </div>

          <div className="input-group">
            <label>Product Name</label>
            <select name="productName" value={formData.productName} onChange={handleChange} required disabled={loading || !isAuthorized}>
              <option value="">Select Product</option>
              <option value="Corn Grit">Corn Grit</option>
              <option value="Cattle Feed">Cattle Feed</option>
              <option value="Rice Grit">Rice Grit</option>
              <option value="Corn Flour">Corn Flour</option>
            </select>
          </div>

          <div className="input-group">
            <label>Bill No</label>
            <input name="billNo" value={formData.billNo} onChange={handleChange} required disabled={loading || !isAuthorized} />
          </div>

          <div className="input-group">
            <label>Customer Name</label>
            <input name="customerName" value={formData.customerName} onChange={handleChange} required disabled={loading || !isAuthorized} />
          </div>

          <div className="input-group">
            <label>Quantity</label>
            <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} disabled={loading || !isAuthorized} />
          </div>

          <div className="input-group">
            <label>Rate</label>
            <input type="number" name="rate" value={formData.rate} onChange={handleChange} disabled={loading || !isAuthorized} />
          </div>

          <div className="input-group readonly-group">
            <label>Total Price (₹)</label>
            <input value={formData.totalPrice} readOnly style={{backgroundColor: '#f9f9f9'}} />
          </div>

          <div className="input-group">
            <label>Amount Received (₹)</label>
            <input type="number" name="amountReceived" value={formData.amountReceived} onChange={handleChange} disabled={loading || !isAuthorized} />
          </div>

          <div className="input-group readonly-group">
            <label>Payment Due (₹)</label>
            <input value={formData.paymentDue} readOnly style={{color: 'red', fontWeight: 'bold'}} />
          </div>

          <div className="input-group span-2">
            <label>Remarks</label>
            <input name="remarks" value={formData.remarks} onChange={handleChange} disabled={loading || !isAuthorized} />
          </div>

          <div className="button-container-full">
            <button
              type="button"
              onClick={handleReset}
              className="btn-reset-3d"
              disabled={loading || !isAuthorized}
              style={{ opacity: isAuthorized ? 1 : 0.6, cursor: isAuthorized ? "pointer" : "not-allowed" }}
            >
              Reset
            </button>
            
            <button
              type="submit"
              className="btn-submit-colored"
              disabled={loading || !isAuthorized}
              style={{ opacity: isAuthorized ? 1 : 0.6, cursor: isAuthorized ? "pointer" : "not-allowed" }}
            >
              {loading ? "Saving..." : !isAuthorized ? "🔒 Read Only" : "✅ Save Sale"}
            </button>
          </div>
        </form>
      </div>

      {/* 🔔 MUI Snackbar (Purane Alert ki jagah) */}
      <CustomSnackbar 
        open={snackbar.open} 
        message={snackbar.message} 
        severity={snackbar.severity} 
        onClose={() => setSnackbar({ ...snackbar, open: false })} 
      />
    </div>
  );
};

export default SalesEntry;