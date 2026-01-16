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
    items: [{ productName: "", quantity: "", rate: "" }],
    billNo: "",
    vehicleNo: "",
    travelingCost: "", 
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

  // ==========================================
  // 🔘 UPDATED: Customer Select with Popup Logic
  // ==========================================
  const handleCustomerSelect = (e) => {
    const selectedName = e.target.value;

    // ✨ Yahan hum check kar rahe hain ki kya dropdown se "Local customer" select hua hai
    if (selectedName === "Local customer") {
      const customName = window.prompt("Please enter Local Customer Name for the Bill:");
      
      if (customName && customName.trim() !== "") {
        setFormData((prev) => ({
          ...prev,
          customerName: customName.trim().toUpperCase(), // Popup wala naam yahan save hoga
          gstin: "URD (Local)",
          mobile: "",
          address: "Local Market",
        }));
      } else {
        // Agar user prompt cancel kar de
        setFormData((prev) => ({ ...prev, customerName: "" }));
      }
      return; 
    }

    // Normal Registered Supplier Logic
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

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const newItems = [...formData.items];
    newItems[index][name] = value;
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productName: "", quantity: "", rate: "" }]
    });
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData({ ...formData, items: newItems });
    }
  };

  useEffect(() => {
    let subTotal = 0;
    formData.items.forEach(item => {
      subTotal += toSafeNumber(item.quantity) * toSafeNumber(item.rate);
    });

    const freight = toSafeNumber(formData.travelingCost);
    const cdPercent = toSafeNumber(formData.cashDiscount);
    const received = toSafeNumber(formData.amountReceived);
    
    const discountAmt = (subTotal * cdPercent) / 100;
    const total = subTotal - freight - discountAmt;
    const due = total - received;

    setFormData((prev) => ({ ...prev, totalPrice: total, paymentDue: due }));
  }, [formData.items, formData.travelingCost, formData.cashDiscount, formData.amountReceived]);

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
      const freightValue = toSafeNumber(formData.travelingCost);
      
      const goods = formData.items.map(item => {
        const qty = toSafeNumber(item.quantity);
        const rate = toSafeNumber(item.rate);
        const taxable = qty * rate;
        
        return {
          product: item.productName,
          quantity: qty,
          rate: rate,
          taxableAmount: taxable,
          hsn: item.productName.includes("Corn Grit") ? "11031300" :
               item.productName.includes("Rice Grit") ? "10064000" :
               item.productName.includes("Cattle Feed") ? "23099010" :
               "11022000"
        };
      });

      const totalTaxable = goods.reduce((sum, g) => sum + g.taxableAmount, 0);

      const payload = {
        ...formData,
        travelingCost: freightValue * -1, 
        si: nextSi,
        taxableValue: totalTaxable,
        totalAmount: formData.totalPrice,
        paymentDue: formData.paymentDue,
        goods: goods
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
        <h2 className="form-title">Professional Sales & Multi-Item Entry</h2>
        
        <form onSubmit={handleSubmit} className="sales-form-grid">
          <div className="input-group"><label>Invoice Date</label><input type="date" name="date" value={formData.date} onChange={handleChange} /></div>
          <div className="input-group"><label>Invoice No</label><input name="billNo" value={formData.billNo} onChange={handleChange} required /></div>
          <div className="input-group">
            <label>Customer Name</label>
            <select 
               name="customerNameSelect" 
               value={suppliers.some(s => s.name === formData.customerName) ? formData.customerName : (formData.gstin === "URD (Local)" ? "Local customer" : "")} 
               onChange={handleCustomerSelect} 
               required
            >
              <option value="">-- Select Customer --</option>
              {suppliers.map((s) => (<option key={s._id} value={s.name}>{s.name}</option>))}
            </select>
          </div>

          <div className="input-group"><label>GSTIN</label><input value={formData.gstin} readOnly className="readonly-input" /></div>
          <div className="input-group"><label>Mobile</label><input value={formData.mobile} readOnly className="readonly-input" /></div>
          <div className="input-group"><label>Vehicle No</label><input name="vehicleNo" value={formData.vehicleNo} onChange={handleChange} placeholder="BR01..." /></div>

          <div className="input-group"><label>Delivery Note (Bags)</label><input name="deliveryNote" value={formData.deliveryNote} onChange={handleChange} /></div>
          <div className="input-group"><label>Delivery Note Date</label><input type="date" name="deliveryNoteDate" value={formData.deliveryNoteDate} onChange={handleChange} /></div>
          <div className="input-group"><label>Buyer Order No</label><input name="buyerOrderNo" value={formData.buyerOrderNo} onChange={handleChange} /></div>

          <div className="input-group"><label>Buyer Order Date</label><input type="date" name="buyerOrderDate" value={formData.buyerOrderDate} onChange={handleChange} /></div>
          <div className="input-group"><label>Dispatch Doc No</label><input name="dispatchDocNo" value={formData.dispatchDocNo} onChange={handleChange} /></div>
          <div className="input-group"><label>Dispatch Date</label><input type="date" name="dispatchDate" value={formData.dispatchDate} onChange={handleChange} /></div>

          <div className="input-group">
            <label>Dispatched Through</label>
            <select name="dispatchedThrough" value={formData.dispatchedThrough} onChange={handleChange}>
              <option value="">-- Select Vehicle --</option>
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

          <div className="span-3 item-section-container" style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', margin: '10px 0', backgroundColor: '#f9f9f9' }}>
            <h3 style={{ marginBottom: '15px', color: '#333', borderBottom: '1px solid #ccc' }}>Product Details</h3>
            {formData.items.map((item, index) => (
              <div key={index} className="item-row" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 50px', gap: '10px', marginBottom: '10px', alignItems: 'end' }}>
                <div className="input-group">
                  <label>Product {index + 1}</label>
                  <select name="productName" value={item.productName} onChange={(e) => handleItemChange(index, e)} required>
                    <option value="">-- Choose Product --</option>
                    <option value="Corn Grit">Corn Grit</option>
                    <option value="Corn Grit (3mm)">Corn Grit (3mm)</option>
                    <option value="Cattle Feed">Cattle Feed</option>
                    <option value="Rice Grit">Rice Grit</option>
                    <option value="Corn Flour">Corn Flour</option>
                    <option value="Rice Flour">Rice Flour</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Qty (KG)</label>
                  <input type="number" name="quantity" value={item.quantity} onChange={(e) => handleItemChange(index, e)} required />
                </div>
                <div className="input-group">
                  <label>Rate (₹)</label>
                  <input type="number" name="rate" value={item.rate} onChange={(e) => handleItemChange(index, e)} required />
                </div>
                {formData.items.length > 1 && (
                  <button type="button" onClick={() => removeItem(index)} style={{ backgroundColor: '#ff4d4d', color: 'white', border: 'none', borderRadius: '4px', height: '38px', cursor: 'pointer' }}>✖</button>
                )}
              </div>
            ))}
            <button type="button" onClick={addItem} style={{ padding: '8px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>+ Add Item</button>
          </div>

          <div className="input-group"><label>Freight Charge (₹) [-]</label><input type="number" name="travelingCost" value={formData.travelingCost} onChange={handleChange} placeholder="Subtracts from total" /></div>
          <div className="input-group"><label>Discount %</label><input type="number" name="cashDiscount" value={formData.cashDiscount} onChange={handleChange} /></div>
          
          <div className="input-group span-3">
            <label>Terms of Delivery</label>
            <textarea name="termsOfDelivery" value={formData.termsOfDelivery} onChange={handleChange} style={{width: '100%', borderRadius: '5px', border: '1px solid #ccc', padding: '10px', minHeight: '60px'}} placeholder="Delivery terms..." />
          </div>

          <div className="input-group readonly-group"><label>Final Bill Amount</label><input value={formData.totalPrice.toFixed(2)} readOnly style={{backgroundColor: '#e9ecef', fontWeight: 'bold'}} /></div>
          <div className="input-group"><label>Received Amount (₹)</label><input type="number" name="amountReceived" value={formData.amountReceived} onChange={handleChange} /></div>
          <div className="input-group readonly-group"><label>Balance Due</label><input value={formData.paymentDue.toFixed(2)} readOnly style={{color: formData.paymentDue > 0 ? 'red' : 'green', fontWeight:'bold', backgroundColor: '#e9ecef'}} /></div>

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