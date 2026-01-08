import React, { useState, useEffect } from "react";
import "./Sales.css";
import axios from "axios";
import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

const toSafeNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const SalesEntry = ({ role }) => {
  const isAuthorized = role === "Admin" || role === "Accountant";

  const initialState = {
    date: new Date().toISOString().split("T")[0],
    customerName: "",
    gstin: "",      // Added for auto-fill
    mobile: "",     // Added for auto-fill
    address: "",    // Added for auto-fill
    productName: "",
    billNo: "",
    vehicleNo: "",
    quantity: "",
    rate: "",
    travelingCost: "",
    cashDiscount: "",
    totalPrice: 0,
    amountReceived: "",
    paymentDue: 0,
    remarks: "",
    billDueDate: "",
    deliveryNote: "",
    paymentMode: "BY BANK",
    buyerOrderNo: "",
    orderDate: "",
    dispatchDocNo: "",
    deliveryNoteDate: "",
    dispatchedThrough: "",
    destination: "",
    lrRrNo: "",
    termsOfDelivery: "",
  };

  const [formData, setFormData] = useState(initialState);
  const [suppliers, setSuppliers] = useState([]); // Suppliers list state
  const [nextSi, setNextSi] = useState(1);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const showMsg = (msg, type = "success") => {
    setSnackbar({ open: true, message: msg, severity: type });
  };

  /* =========================================
     📡 Fetch Suppliers & Next SI on Load
  ========================================== */
/* =========================================
    📡 Fetch Suppliers & Next SI on Load
========================================== */
useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      // Path ko check karein: Agar /api/suppliers nahi chal raha toh /api/suppliers/list try karein
      const supRes = await axios.get(`${API_URL}/api/suppliers/list`); 
      
      // Data check logic: MongoDB Compass ke mutabiq data "data" field mein hota hai
      if (supRes.data && supRes.data.success) {
        setSuppliers(supRes.data.data);
      } else {
        console.warn("API success toh hai par data nahi mila:", supRes.data);
      }

      // Sales SI logic
      const salesRes = await axios.get(`${API_URL}/api/sales`);
      if (salesRes.data.success && salesRes.data.data.length > 0) {
        const lastSi = Math.max(...salesRes.data.data.map((s) => s.si || 0));
        setNextSi(lastSi + 1);
      }
    } catch (err) { 
      console.error("Data fetch error details:", err.response || err);
      showMsg("Database se customers load nahi ho paye", "error");
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, [API_URL]);

  /* =========================================
     🎯 Auto-Fill Customer Logic
  ========================================== */
  const handleCustomerSelect = (e) => {
    const selectedName = e.target.value;
    const customer = suppliers.find((s) => s.name === selectedName);

    if (customer) {
      setFormData((prev) => ({
        ...prev,
        customerName: customer.name,
        gstin: customer.gstin || "", // Mapping from DB
        mobile: customer.phone || "", // Mapping from DB
        address: customer.address || "", // Mapping from DB
      }));
    } else {
      setFormData((prev) => ({ ...prev, customerName: selectedName, gstin: "", mobile: "", address: "" }));
    }
  };

  // Live Calculation logic remains same...
  useEffect(() => {
    const qty = toSafeNumber(formData.quantity);
    const rate = toSafeNumber(formData.rate);
    const freight = toSafeNumber(formData.travelingCost);
    const cdPercent = toSafeNumber(formData.cashDiscount);
    const received = toSafeNumber(formData.amountReceived);
    const base = qty * rate;
    const discount = (base * cdPercent) / 100;
    const total = base + freight - discount;
    const due = total - received;
    setFormData((prev) => ({ ...prev, totalPrice: total, paymentDue: due }));
  }, [formData.quantity, formData.rate, formData.travelingCost, formData.cashDiscount, formData.amountReceived]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthorized) { showMsg("Unauthorized!", "error"); return; }
    setLoading(true);
    try {
      const payload = { ...formData, si: nextSi };
      const res = await axios.post(`${API_URL}/api/sales`, payload);
      if (res.data.success) {
        showMsg("Sale Saved Successfully!", "success");
        setFormData(initialState);
      }
    } catch (error) { showMsg("Error saving data", "error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="sales-container">
      {loading && <Loader />}
      <div className="sales-card-wide">
        <h2 className="form-title">Sales Entry (Professional Invoice)</h2>
        
        <form onSubmit={handleSubmit} className="sales-form-grid">
          {/* Section 1: Basic Info & Auto-fill Customer */}
          <div className="input-group"><label>Invoice Date</label><input type="date" name="date" value={formData.date} onChange={handleChange} /></div>
          <div className="input-group"><label>Invoice No.</label><input name="billNo" value={formData.billNo} onChange={handleChange} required /></div>
          
          <div className="input-group">
            <label>Select Customer (Auto-fill)</label>
            <select 
              name="customerName" 
              value={formData.customerName} 
              onChange={handleCustomerSelect} 
              required
            >
              <option value="">-- Choose Customer --</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>GSTIN</label>
            <input name="gstin" value={formData.gstin} readOnly style={{background: '#f0f0f0'}} />
          </div>

          <div className="input-group">
            <label>Mobile No</label>
            <input name="mobile" value={formData.mobile} readOnly style={{background: '#f0f0f0'}} />
          </div>

          <div className="input-group">
            <label>Payment Mode</label>
            <select name="paymentMode" value={formData.paymentMode} onChange={handleChange}>
              <option value="BY BANK">BY BANK</option>
              <option value="CASH">CASH</option>
              <option value="CREDIT">CREDIT</option>
            </select>
          </div>

          {/* Other fields remain the same... */}
          <div className="input-group span-2"><label>Customer Address</label><input name="address" value={formData.address} readOnly style={{background: '#f0f0f0'}} /></div>

          {/* Section 2: Order & Delivery */}
          <div className="input-group"><label>Delivery Note</label><input name="deliveryNote" placeholder="e.g. 66 BAGS" value={formData.deliveryNote} onChange={handleChange} /></div>
          <div className="input-group"><label>Buyer's Order No.</label><input name="buyerOrderNo" value={formData.buyerOrderNo} onChange={handleChange} /></div>
          <div className="input-group"><label>Order Date</label><input type="date" name="orderDate" value={formData.orderDate} onChange={handleChange} /></div>
          
          {/* Dispatch & Calculation fields same as before... */}
          <div className="input-group"><label>Motor Vehicle No.</label><input name="vehicleNo" value={formData.vehicleNo} onChange={handleChange} /></div>

          {/* Section 4: Product & Calculation */}
          <div className="input-group">
            <label>Product</label>
            <select name="productName" value={formData.productName} onChange={handleChange} required>
              <option value="">Select Product</option>
              <option value="Corn Grit">Corn Grit</option>
              <option value="Cattle Feed">Cattle Feed</option>
            </select>
          </div>
          <div className="input-group"><label>Quantity</label><input type="number" name="quantity" value={formData.quantity} onChange={handleChange} /></div>
          <div className="input-group"><label>Rate</label><input type="number" name="rate" value={formData.rate} onChange={handleChange} /></div>
          <div className="input-group"><label>Freight (₹)</label><input type="number" name="travelingCost" value={formData.travelingCost} onChange={handleChange} /></div>
          <div className="input-group"><label>Cash Discount %</label><input type="number" name="cashDiscount" value={formData.cashDiscount} onChange={handleChange} /></div>
          
          <div className="input-group readonly-group"><label>Total Amount</label><input value={formData.totalPrice} readOnly /></div>
          <div className="input-group"><label>Received (₹)</label><input type="number" name="amountReceived" value={formData.amountReceived} onChange={handleChange} /></div>
          <div className="input-group readonly-group"><label>Due</label><input value={formData.paymentDue} readOnly style={{color:'red'}} /></div>

          <div className="button-container-full">
            <button type="button" onClick={() => setFormData(initialState)}>Reset Form</button>
            <button type="submit" disabled={loading}>{loading ? "Saving..." : "✅ Save Sale & Adjust Stock"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SalesEntry;