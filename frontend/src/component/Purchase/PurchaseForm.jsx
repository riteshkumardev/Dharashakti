import React, { useState, useEffect } from "react";
import './Purchase.css';
import axios from "axios"; 

// 🏗️ Core Components Import
import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

const PurchaseForm = ({ onCancel, role }) => {
  // 🔐 Permission Check
  const isAuthorized = role === "Admin" || role === "Accountant";

  const initialState = {
    date: new Date().toISOString().split("T")[0],
    supplierName: "",
    productName: "",
    billNo: "",
    vehicleNo: "",
    quantity: "",
    rate: "",
    cashDiscount: "", // % में CD
    totalAmount: 0,
    paidAmount: "",
    balanceAmount: 0,
    remarks: "",
  };

  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const showMsg = (msg, type = "success") => {
    setSnackbar({ open: true, message: msg, severity: type });
  };

  const productList = ["Corn", "Corn Greet", "Cattlefeed", "Aatarice", "Rice Greet", "Packing Bag"];

  // 2️⃣ Live Calculations (Purchase logic with CD%)
  useEffect(() => {
    const qty = Number(formData.quantity) || 0;
    const rate = Number(formData.rate) || 0;
    const cdPercent = Number(formData.cashDiscount) || 0;

    const basePrice = qty * rate;
    const discountAmount = (basePrice * cdPercent) / 100;

    const total = basePrice - discountAmount; 
    const balance = total - (Number(formData.paidAmount) || 0);

    setFormData((prev) => ({
      ...prev,
      totalAmount: total,
      balanceAmount: balance,
    }));
  }, [formData.quantity, formData.rate, formData.cashDiscount, formData.paidAmount]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFormData(initialState);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthorized) {
      showMsg("Unauthorized: Permission Denied!", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/purchases`, formData);

      if (res.data.success) {
        showMsg("✅ Purchase Record Saved Successfully!", "success");
        handleReset();
        if (onCancel) onCancel(); // फॉर्म क्लोज करने के लिए
      }
    } catch (error) {
      showMsg("❌ Data save nahi ho paya. Backend check karein.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sales-container">
      {loading && <Loader />}
      <div className="sales-card-wide">
        <div className="form-header-flex" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 className="form-title">Purchase Entry (Live Stock)</h2>
          {!isAuthorized && <span className="locked-badge" style={{color: 'red', fontSize: '12px'}}>🔒 Read Only</span>}
        </div>

        <form onSubmit={handleSubmit} className="sales-form-grid">
          <div className="input-group">
            <label>Date</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} disabled={loading || !isAuthorized} />
          </div>

          <div className="input-group">
            <label>Supplier Name</label>
            <input name="supplierName" value={formData.supplierName} onChange={handleChange} required placeholder="Enter Supplier Name" disabled={loading || !isAuthorized} />
          </div>

          <div className="input-group">
            <label>Product Name</label>
            <select name="productName" value={formData.productName} onChange={handleChange} required disabled={loading || !isAuthorized}>
              <option value="">-- Select Product --</option>
              {productList.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="input-group">
            <label>Bill No</label>
            <input name="billNo" value={formData.billNo} onChange={handleChange} placeholder="Optional" disabled={loading || !isAuthorized} />
          </div>

          <div className="input-group">
            <label>Vehicle No</label>
            <input name="vehicleNo" value={formData.vehicleNo} onChange={handleChange} placeholder="e.g. BR-01-1234" disabled={loading || !isAuthorized} />
          </div>

          <div className="input-group">
            <label>Quantity</label>
            <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} required placeholder="0.00" disabled={loading || !isAuthorized} />
          </div>

          <div className="input-group">
            <label>Rate</label>
            <input type="number" name="rate" value={formData.rate} onChange={handleChange} required placeholder="0.00" disabled={loading || !isAuthorized} />
          </div>

          <div className="input-group">
            <label>Cash Discount (CD %)</label>
            <input type="number" name="cashDiscount" value={formData.cashDiscount} onChange={handleChange} placeholder="0" disabled={loading || !isAuthorized} />
          </div>

          <div className="input-group readonly-group">
            <label>Total Amount (₹) <small>(Qty*Rate - CD%)</small></label>
            <input value={formData.totalAmount} readOnly style={{backgroundColor: '#f9f9f9'}} />
          </div>

          <div className="input-group">
            <label>Paid Amount (₹)</label>
            <input type="number" name="paidAmount" value={formData.paidAmount} onChange={handleChange} placeholder="0" disabled={loading || !isAuthorized} />
          </div>

          <div className="input-group readonly-group">
            <label>Balance Amount (₹)</label>
            <input value={formData.balanceAmount} readOnly style={{color: 'red', fontWeight: 'bold'}} />
          </div>

          <div className="input-group span-2">
            <label>Remarks</label>
            <input name="remarks" value={formData.remarks} onChange={handleChange} placeholder="Add notes here..." disabled={loading || !isAuthorized} />
          </div>

          <div className="button-container-full">
            <button type="button" onClick={onCancel} className="btn-reset-3d" disabled={loading}>Cancel</button>
            <button type="submit" className="btn-submit-colored" disabled={loading || !isAuthorized}>
              {loading ? "Saving..." : !isAuthorized ? "🔒 Locked" : "✅ Save Purchase"}
            </button>
          </div>
        </form>
      </div>

      <CustomSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} />
    </div>
  );
};

export default PurchaseForm;