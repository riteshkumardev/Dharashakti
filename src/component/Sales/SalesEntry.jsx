import React, { useState, useEffect } from "react";
import "./Sales.css";
import { getDatabase, ref, push, set, query, limitToLast, onValue } from "firebase/database";
import { app } from "../../redux/api/firebase/firebase"; 

const SalesEntry = () => {
  const db = getDatabase(app);

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
  const [nextSi, setNextSi] = useState(1); // SI No. state
  const [loading, setLoading] = useState(false);

  // 1. Firebase se Last SI No. fetch karna
  useEffect(() => {
    const salesRef = query(ref(db, "sales"), limitToLast(1));
    const unsubscribe = onValue(salesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const lastEntry = Object.values(data)[0];
        const lastSi = Number(lastEntry.si) || 0;
        setNextSi(lastSi + 1);
      } else {
        setNextSi(1); // Agar koi data nahi hai toh 1 se start hoga
      }
    });
    return () => unsubscribe();
  }, [db]);

  // 2. Auto-Calculation logic
  useEffect(() => {
    const total = (Number(formData.quantity) || 0) * (Number(formData.rate) || 0);
    const due = total - (Number(formData.amountReceived) || 0);

    setFormData((prev) => ({
      ...prev,
      totalPrice: total,
      paymentDue: due,
    }));
  }, [formData.quantity, formData.rate, formData.amountReceived]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => setFormData(initialState);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const salesRef = ref(db, "sales");
      const newSaleRef = push(salesRef);

      await set(newSaleRef, {
        ...formData,
        si: nextSi, // Auto-incremented SI No. yahan save hoga
        timestamp: new Date().getTime()
      });

      alert(`🎉 Sale Entry Saved! SI No: ${nextSi}`);
      handleReset();
    } catch (error) {
      console.error("Error saving sale:", error);
      alert("❌ Error: Data save nahi ho paya.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sales-container">
      <div className="sales-card-wide">
        <div className="form-header-flex" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
           <h2 className="form-title">Sales Entry (Cloud)</h2>
           <div className="si-badge" style={{padding: '5px 15px', background: '#e0f0ff', borderRadius: '20px', fontWeight: 'bold', color: '#007bff'}}>
              SI No: {nextSi}
           </div>
        </div>

        <form onSubmit={handleSubmit} className="sales-form-grid">
          {/* Row 1 */}
          <div className="input-group">
            <label>Date</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} />
          </div>

          <div className="input-group">
            <label>Product Name</label>
            <select name="productName" value={formData.productName} onChange={handleChange} required className="select-input">
              <option value="">Select Product</option>
              <option value="Corn Grit">Corn Grit</option>
              <option value="Cattle Feed">Cattle Feed</option>
              <option value="Rice Grit">Rice Grit</option>
              <option value="Corn Flour">Corn Flour</option>
            </select>
          </div>

          <div className="input-group">
            <label>Bill No</label>
            <input name="billNo" value={formData.billNo} onChange={handleChange} required />
          </div>

          <div className="input-group">
            <label>Customer Name</label>
            <input name="customerName" value={formData.customerName} onChange={handleChange} required />
          </div>

          {/* Row 2 */}
          <div className="input-group">
            <label>Quantity</label>
            <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} />
          </div>
          <div className="input-group">
            <label>Rate</label>
            <input type="number" name="rate" value={formData.rate} onChange={handleChange} />
          </div>
          <div className="input-group readonly-group">
            <label>Total Price</label>
            <input value={formData.totalPrice} readOnly className="readonly-input" />
          </div>
          <div className="input-group">
            <label>Amount Received</label>
            <input type="number" name="amountReceived" value={formData.amountReceived} onChange={handleChange} />
          </div>

          {/* Row 3 */}
          <div className="input-group readonly-group">
            <label>Payment Due</label>
            <input value={formData.paymentDue} readOnly className="readonly-input highlight-due" />
          </div>
          <div className="input-group">
            <label>Due Date</label>
            <input type="date" name="billDueDate" value={formData.billDueDate} onChange={handleChange} />
          </div>
          <div className="input-group span-2">
            <label>Remarks</label>
            <input name="remarks" value={formData.remarks} onChange={handleChange} placeholder="Any notes..." />
          </div>

          <div className="button-container-full">
            <button type="button" onClick={handleReset} className="btn-reset-3d">Reset</button>
            <button type="submit" className="btn-submit-colored" disabled={loading}>
              {loading ? "Saving..." : "✅ Save Sale"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SalesEntry;