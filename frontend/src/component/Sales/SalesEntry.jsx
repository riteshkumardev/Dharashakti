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
    gstin: "",
    mobile: "",
    address: "",
    productName: "",
    billNo: "",
    vehicleNo: "",
    quantity: "",
    rate: "",
    travelingCost: "", // This is the Freight amount
    cashDiscount: "",
    totalPrice: 0,
    amountReceived: "",
    paymentDue: 0,
    remarks: "",
    deliveryNote: "",
    deliveryNoteDate: "", 
    paymentMode: "BY BANK",
    buyerOrderNo: "",
    buyerOrderDate: "",
    dispatchDocNo: "",
    dispatchDate: "",
    dispatchedThrough: "", 
    destination: "",
    lrRrNo: "",
    termsOfDelivery: "",
  };

  const [formData, setFormData] = useState(initialState);
  const [suppliers, setSuppliers] = useState([]);
  const [nextSi, setNextSi] = useState(1);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const showMsg = (msg, type = "success") => {
    setSnackbar({ open: true, message: msg, severity: type });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const supRes = await axios.get(`${API_URL}/api/suppliers/list`); 
        if (supRes.data && supRes.data.success) setSuppliers(supRes.data.data);

        const salesRes = await axios.get(`${API_URL}/api/sales`);
        if (salesRes.data.success && salesRes.data.data.length > 0) {
          const lastSi = Math.max(...salesRes.data.data.map((s) => s.si || 0));
          setNextSi(lastSi + 1);
        }
      } catch (err) { 
        showMsg("Database connection error", "error");
      } finally { setLoading(false); }
    };
    fetchData();
  }, [API_URL]);

  const handleCustomerSelect = (e) => {
    const selectedName = e.target.value;
    const customer = suppliers.find((s) => s.name === selectedName);
    if (customer) {
      setFormData((prev) => ({
        ...prev,
        customerName: customer.name,
        gstin: customer.gstin || "",
        mobile: customer.phone || "",
        address: customer.address || "",
      }));
    } else {
      setFormData((prev) => ({ ...prev, customerName: selectedName, gstin: "", mobile: "", address: "" }));
    }
  };

  /* =========================================
      🧮 Updated Logic: Total = Base - Freight - Discount
  ========================================== */
  useEffect(() => {
    const qty = toSafeNumber(formData.quantity);
    const rate = toSafeNumber(formData.rate);
    const freightValue = toSafeNumber(formData.travelingCost);
    const cdPercent = toSafeNumber(formData.cashDiscount);
    const received = toSafeNumber(formData.amountReceived);
    
    const baseAmount = qty * rate;
    const discount = (baseAmount * cdPercent) / 100;
    
    // Logic: Always subtract freight from the total bill amount
    const total = baseAmount - freightValue - discount;
    
    const due = total - received;
    setFormData((prev) => ({ ...prev, totalPrice: total, paymentDue: due }));
  }, [formData.quantity, formData.rate, formData.travelingCost, formData.cashDiscount, formData.amountReceived]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
const handleSubmit = async (e) => {
  e.preventDefault();
  if (!isAuthorized) { 
    showMsg("Unauthorized access!", "error"); 
    return; 
  }

  setLoading(true);
  try {
    const qty = toSafeNumber(formData.quantity);
    const rate = toSafeNumber(formData.rate);
    const freightValue = toSafeNumber(formData.travelingCost);
    const taxable = qty * rate;

    const payload = {
      ...formData,

      // ✅ VERY IMPORTANT
      travelingCost: freightValue * -1, // 👈 always send NEGATIVE

      si: nextSi,
      taxableValue: taxable,
      totalAmount: formData.totalPrice,
      paymentDue: formData.paymentDue,

      goods: [{
        product: formData.productName,
        quantity: qty,
        rate: rate,
        taxableAmount: taxable,
        hsn:
          formData.productName.includes("Corn Grit") ? "11031300" :
          formData.productName.includes("Rice Grit") ? "10064000" :
          formData.productName.includes("Cattle Feed") ? "23099010" :
          "11022000"
      }]
    };

    const res = await axios.post(`${API_URL}/api/sales`, payload);
    if (res.data.success) {
      showMsg("Sale saved successfully!", "success");
      setFormData(initialState);
    }
  } catch (error) {
    showMsg(error.response?.data?.message || "Server Error", "error");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="sales-container">
      {loading && <Loader />}
      <div className="sales-card-wide">
        <h2 className="form-title">Professional Sales & Dispatch Entry</h2>
        
        <form onSubmit={handleSubmit} className="sales-form-grid">
          <div className="input-group"><label>Invoice Date</label><input type="date" name="date" value={formData.date} onChange={handleChange} /></div>
          <div className="input-group"><label>Invoice No</label><input name="billNo" value={formData.billNo} onChange={handleChange} required /></div>
          <div className="input-group">
            <label>Customer Name</label>
            <select name="customerName" value={formData.customerName} onChange={handleCustomerSelect} required>
              <option value="">-- Select Customer --</option>
              {suppliers.map((s) => (<option key={s._id} value={s.name}>{s.name}</option>))}
            </select>
          </div>

          <div className="input-group"><label>GSTIN</label><input value={formData.gstin} readOnly className="readonly-input" /></div>
          <div className="input-group"><label>Mobile</label><input value={formData.mobile} readOnly className="readonly-input" /></div>
          <div className="input-group"><label>Vehicle No</label><input name="vehicleNo" value={formData.vehicleNo} onChange={handleChange} placeholder="BR01..." /></div>

          <div className="input-group"><label>Delivery Note (Bags)</label><input name="deliveryNote" value={formData.deliveryNote} onChange={handleChange} placeholder="e.g. 280" /></div>
          <div className="input-group"><label>Delivery Note Date</label><input type="date" name="deliveryNoteDate" value={formData.deliveryNoteDate} onChange={handleChange} /></div>
          
          <div className="input-group"><label>Buyer Order No</label><input name="buyerOrderNo" value={formData.buyerOrderNo} onChange={handleChange} /></div>
          <div className="input-group"><label>Buyer Order Date</label><input type="date" name="buyerOrderDate" value={formData.buyerOrderDate} onChange={handleChange} /></div>
          
          <div className="input-group"><label>Dispatch Doc No</label><input name="dispatchDocNo" value={formData.dispatchDocNo} onChange={handleChange} /></div>
          <div className="input-group"><label>Dispatch Date</label><input type="date" name="dispatchDate" value={formData.dispatchDate} onChange={handleChange} /></div>

          <div className="input-group">
            <label>Dispatched Through</label>
            <select 
              name="dispatchedThrough" 
              value={formData.dispatchedThrough} 
              onChange={handleChange}
              required
            >
              <option value="">-- Select Vehicle Type --</option>
              <option value="Truck">Truck</option>
              <option value="Tanker">Tanker</option>
              <option value="Pick-up">Pick-up</option>
              <option value="Mini Truck">Mini Truck</option>
              <option value="Tractor">Tractor</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="input-group"><label>Destination</label><input name="destination" value={formData.destination} onChange={handleChange} /></div>
          <div className="input-group"><label>LR/RR No</label><input name="lrRrNo" value={formData.lrRrNo} onChange={handleChange} /></div>
          <div className="input-group">
            <label>Payment Mode</label>
            <select name="paymentMode" value={formData.paymentMode} onChange={handleChange}>
              <option value="BY BANK">BY BANK</option>
              <option value="CASH">CASH</option>
              <option value="CREDIT">CREDIT</option>
            </select>
          </div>

          <div className="input-group span-2"><label>Address</label><input value={formData.address} readOnly className="readonly-input" /></div>
          
          <div className="input-group span-1">
            <label>Product</label>
            <select name="productName" value={formData.productName} onChange={handleChange} required>
              <option value="">-- Choose Product --</option>
              <option value="Corn Grit">Corn Grit</option>
              <option value="Corn Grit (3mm)">Corn Grit (3mm)</option>
              <option value="Cattle Feed">Cattle Feed</option>
              <option value="Rice Grit">Rice Grit</option>
              <option value="Corn Flour">Corn Flour</option>
            </select>
          </div>

          <div className="input-group"><label>Quantity (KG)</label><input type="number" name="quantity" value={formData.quantity} onChange={handleChange} /></div>
          <div className="input-group"><label>Rate (₹)</label><input type="number" name="rate" value={formData.rate} onChange={handleChange} /></div>
          <div className="input-group"><label>Freight Charge (₹) [-]</label><input type="number" name="travelingCost" value={formData.travelingCost} onChange={handleChange} placeholder="Always subtracts" /></div>
          <div className="input-group"><label>Discount %</label><input type="number" name="cashDiscount" value={formData.cashDiscount} onChange={handleChange} /></div>

          <div className="input-group span-3">
            <label>Terms of Delivery</label>
            <textarea 
               name="termsOfDelivery" 
               value={formData.termsOfDelivery} 
               onChange={handleChange} 
               style={{width: '100%', borderRadius: '5px', border: '1px solid #ccc', padding: '10px', minHeight: '60px'}}
               placeholder="Enter delivery and payment terms here..."
            />
          </div>
          
          <div className="input-group readonly-group"><label>Final Bill Amount</label><input value={formData.totalPrice.toFixed(2)} readOnly /></div>
          <div className="input-group"><label>Received Amount (₹)</label><input type="number" name="amountReceived" value={formData.amountReceived} onChange={handleChange} /></div>
          <div className="input-group readonly-group"><label>Balance Due</label><input value={formData.paymentDue.toFixed(2)} readOnly style={{color: formData.paymentDue > 0 ? 'red' : 'green', fontWeight:'bold'}} /></div>

          <div className="button-container-full">
            <button type="button" className="btn-reset" onClick={() => setFormData(initialState)}>Clear All</button>
            <button type="submit" className="btn-save" disabled={loading}>{loading ? "Saving..." : "✅ Save Entry"}</button>
          </div>
        </form>
      </div>

      <CustomSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} />
    </div>
  );
};

export default SalesEntry;