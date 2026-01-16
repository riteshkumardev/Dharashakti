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
    gstin: "",      // 🆕 Auto-fill logic ke liye
    mobile: "",     // 🆕 Auto-fill logic ke liye
    address: "",    // 🆕 Auto-fill logic ke liye
    productName: "",
    billNo: "",
    vehicleNo: "",
    quantity: "",
    rate: "",
    travelingCost: "", 
    cashDiscount: "", 
    totalAmount: 0,
    paidAmount: "",
    balanceAmount: 0,
    remarks: "",
  };

  const [formData, setFormData] = useState(initialState);
  const [suppliers, setSuppliers] = useState([]); // 🆕 Suppliers list state
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const showMsg = (msg, type = "success") => {
    setSnackbar({ open: true, message: msg, severity: type });
  };

  const productList = ["Corn", "Corn Greet", "Cattle Feed", "Aatarice", "Rice Greet", "Packing Bag","Rice Broken"];

  /* =========================================
      📡 Fetch Suppliers List on Load
  ========================================== */
  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/api/suppliers/list`); 
        if (res.data && res.data.success) {
          setSuppliers(res.data.data);
        }
      } catch (err) { 
        console.error("Suppliers load error:", err);
        showMsg("Suppliers load nahi ho paye", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchSuppliers();
  }, [API_URL]);

  /* =========================================
      🎯 Auto-Fill Supplier Logic (Updated)
  ========================================== */
  const handleSupplierSelect = (e) => {
    const selectedName = e.target.value;
    const supplier = suppliers.find((s) => s.name === selectedName);

    if (supplier) {
      // ✨ Logic for Local Customer: Ask for custom name
      let finalName = supplier.name;
      if (supplier.name === "Local customer") {
        const customName = prompt("Please enter Local Customer Name for the Bill:");
        if (customName) {
          finalName = customName;
        }
      }

      setFormData((prev) => ({
        ...prev,
        supplierName: finalName, // Yahan final name save hoga
        gstin: supplier.gstin || "N/A",
        mobile: supplier.phone || "N/A",
        address: supplier.address || "N/A",
      }));
    } else {
      setFormData((prev) => ({ 
        ...prev, 
        supplierName: selectedName, 
        gstin: "", 
        mobile: "", 
        address: "" 
      }));
    }
  };

  // 2️⃣ Live Calculations (Qty*Rate - CD% + Travel)
  useEffect(() => {
    const qty = Number(formData.quantity) || 0;
    const rate = Number(formData.rate) || 0;
    const travel = Number(formData.travelingCost) || 0;
    const cdPercent = Number(formData.cashDiscount) || 0;

    const basePrice = qty * rate;
    const discountAmount = (basePrice * cdPercent) / 100;

    const total = basePrice - discountAmount - travel; 
    const balance = total - (Number(formData.paidAmount) || 0);

    setFormData((prev) => ({
      ...prev,
      totalAmount: total,
      balanceAmount: balance,
    }));
  }, [formData.quantity, formData.rate, formData.cashDiscount, formData.paidAmount, formData.travelingCost]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthorized) {
      showMsg("Unauthorized: Permission Denied!", "error");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        quantity: Number(formData.quantity),
        rate: Number(formData.rate),
        travelingCost: Number(formData.travelingCost) || 0,
        cashDiscount: Number(formData.cashDiscount) || 0,
        paidAmount: Number(formData.paidAmount) || 0
      };

      const res = await axios.post(`${API_URL}/api/purchases`, payload);

      if (res.data.success) {
        showMsg("✅ Purchase Record Saved Successfully!", "success");
        setFormData(initialState);
        if (onCancel) setTimeout(() => onCancel(), 1000); 
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
            <label>Select Supplier</label>
            <select 
              name="supplierName" 
              value={formData.supplierName === "" ? "" : (suppliers.find(s => s.name === "Local customer") ? "Local customer" : formData.supplierName)} 
              onChange={handleSupplierSelect} 
              required 
              disabled={loading || !isAuthorized}
            >
              <option value="">-- Choose Supplier --</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>Supplier Name (Saved)</label>
            <input name="supplierName" value={formData.supplierName} readOnly className="readonly-input" style={{backgroundColor: '#e8f5e9', fontWeight: 'bold'}} />
          </div>

          <div className="input-group">
            <label>GSTIN</label>
            <input name="gstin" value={formData.gstin} readOnly className="readonly-input" style={{backgroundColor: '#f0f0f0'}} />
          </div>

          <div className="input-group">
            <label>Mobile No</label>
            <input name="mobile" value={formData.mobile} readOnly className="readonly-input" style={{backgroundColor: '#f0f0f0'}} />
          </div>

          <div className="input-group">
            <label>Bill No</label>
            <input name="billNo" value={formData.billNo} onChange={handleChange} placeholder="Optional" disabled={loading || !isAuthorized} />
          </div>

          <div className="input-group">
            <label>Vehicle No</label>
            <input name="vehicleNo" value={formData.vehicleNo} onChange={handleChange} placeholder="BR-01-XXXX" disabled={loading || !isAuthorized} />
          </div>

          <div className="input-group span-2">
            <label>Supplier Address</label>
            <input name="address" value={formData.address} readOnly className="readonly-input" style={{backgroundColor: '#f0f0f0'}} />
          </div>

          <div className="input-group">
            <label>Product Name</label>
            <select name="productName" value={formData.productName} onChange={handleChange} required disabled={loading || !isAuthorized}>
              <option value="">-- Select Product --</option>
              {productList.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="input-group">
            <label>Quantity (Kg/Unit)</label>
            <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} required placeholder="0" disabled={loading || !isAuthorized} />
          </div>

          <div className="input-group">
            <label>Rate (Per Unit)</label>
            <input type="number" name="rate" value={formData.rate} onChange={handleChange} required placeholder="0.00" disabled={loading || !isAuthorized} />
          </div>

          <div className="input-group">
            <label>Traveling Cost (₹)</label>
            <input type="number" name="travelingCost" value={formData.travelingCost} onChange={handleChange} placeholder="0" disabled={loading || !isAuthorized} />
          </div>

          <div className="input-group">
            <label>Cash Discount (CD %)</label>
            <input type="number" name="cashDiscount" value={formData.cashDiscount} onChange={handleChange} placeholder="0 %" disabled={loading || !isAuthorized} />
          </div>

          <div className="input-group readonly-group">
            <label>Total Amount (₹)</label>
            <input value={formData.totalAmount.toFixed(2)} readOnly style={{backgroundColor: '#e3f2fd', fontWeight: 'bold'}} />
          </div>

          <div className="input-group">
            <label>Paid Amount (₹)</label>
            <input type="number" name="paidAmount" value={formData.paidAmount} onChange={handleChange} placeholder="0" disabled={loading || !isAuthorized} />
          </div>

          <div className="input-group readonly-group">
            <label>Balance Amount (₹)</label>
            <input value={formData.balanceAmount.toFixed(2)} readOnly style={{color: 'red', fontWeight: 'bold', backgroundColor: '#fff5f5'}} />
          </div>

          <div className="input-group span-2">
            <label>Remarks</label>
            <input name="remarks" value={formData.remarks} onChange={handleChange} placeholder="Purchase details..." disabled={loading || !isAuthorized} />
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