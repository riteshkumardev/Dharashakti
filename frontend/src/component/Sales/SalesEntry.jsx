import React, { useState, useEffect } from "react";
import "./Sales.css";
import axios from "axios"; 

// 🏗️ Core Components Import
import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

const SalesEntry = ({ role }) => {
  // 🔐 Permission Check
  const isAuthorized = role === "Admin" || role === "Accountant";

  const initialState = {
    date: new Date().toISOString().split("T")[0],
    customerName: "",
    productName: "",
    billNo: "",
    quantity: "",
    rate: "",
    travelingCost: "",
    cashDiscount: "", // 🆕 नया फील्ड: Cash Discount (CD)
    totalPrice: 0,
    amountReceived: "",
    paymentDue: 0,
    remarks: "",
    billDueDate: "",
  };

  const [formData, setFormData] = useState(initialState);
  const [nextSi, setNextSi] = useState(1);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const showMsg = (msg, type = "success") => {
    setSnackbar({ open: true, message: msg, severity: type });
  };

  const fetchNextSi = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/sales`);
      if (res.data.success && res.data.data.length > 0) {
        const lastSi = Math.max(...res.data.data.map(s => s.si || 0));
        setNextSi(lastSi + 1);
      } else {
        setNextSi(1);
      }
    } catch (err) {
      console.error("SI fetching error:", err);
    }
  };

  useEffect(() => {
    fetchNextSi();
  }, [API_URL]);

  // 2️⃣ Live Calculations (Travel और CD दोनों को घटाया गया है)
useEffect(() => {
  const qty = Number(formData.quantity) || 0;
  const rate = Number(formData.rate) || 0;
  const travel = Number(formData.travelingCost) || 0;
  const cdPercent = Number(formData.cashDiscount) || 0; // अब यह % है

  const basePrice = qty * rate;
  const discountAmount = (basePrice * cdPercent) / 100; // % से रुपया निकाला

  const total = basePrice - travel - discountAmount; 
  const due = total - (Number(formData.amountReceived) || 0);

  setFormData((prev) => ({
    ...prev,
    totalPrice: total,
    paymentDue: due,
  }));
}, [formData.quantity, formData.rate, formData.travelingCost, formData.cashDiscount, formData.amountReceived]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFormData(initialState);
    if (isAuthorized) showMsg("Added sucesfully", "info");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthorized) {
      showMsg(`Sale Saved! SI No: ${nextSi}`, "success");
      showMsg("Unauthorized: Permission Denied!", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/sales`, {
        ...formData,
        si: nextSi
      });

      if (res.data.success) {
        
        handleReset();
        fetchNextSi(); 
      }
    } catch (error) {
      showMsg("Data save nahi ho paya. Backend check karein.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sales-container">
      {loading && <Loader />}
      <div className="sales-card-wide">
        <div className="form-header-flex" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 className="form-title">Sales Entry</h2>
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
              <option value="Corn Grit (3mm)">Corn Grit (3mm)</option>
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

          <div className="input-group">
            <label>Traveling Cost (₹)</label>
            <input type="number" name="travelingCost" value={formData.travelingCost} onChange={handleChange} placeholder="0" disabled={loading || !isAuthorized} />
          </div>

          {/* 🆕 नया इनपुट: Cash Discount (CD) */}
          <div className="input-group">
            <label>Cash Discount / CD %(₹)</label>
            <input type="number" name="cashDiscount" value={formData.cashDiscount?formData.cashDiscount:0} onChange={handleChange} placeholder="0" disabled={loading || !isAuthorized} />
          </div>

          <div className="input-group readonly-group">
            <label>Total Price (₹) <small>(Qty*Rate - Travel - CD)</small></label>
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
            <button type="button" onClick={handleReset} className="btn-reset-3d" disabled={loading || !isAuthorized}>Reset</button>
            <button type="submit" className="btn-submit-colored" disabled={loading || !isAuthorized}>
              {loading ? "Saving..." : !isAuthorized ? "🔒 Read Only" : "✅ Save Sale"}
            </button>
          </div>
        </form>
      </div>

      <CustomSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} />
    </div>
  );
};

export default SalesEntry;