import React, { useState, useEffect } from "react";
import "./Sales.css";
// 1. Firebase imports
import { getDatabase, ref, push, set } from "firebase/database";
import { app } from "../../redux/api/firebase/firebase"; 

const SalesEntry = () => {
  const db = getDatabase(app); // Database instance

  const initialState = {
    si: "",
    date: new Date().toISOString().split("T")[0],
    customerName: "",
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
  const [loading, setLoading] = useState(false);

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
      // 2. Firebase Database mein 'sales' node ke andar data push karein
      const salesRef = ref(db, "sales");
      const newSaleRef = push(salesRef); // Unique ID generate karega

      await set(newSaleRef, {
        ...formData,
        timestamp: new Date().getTime() // Sorting ke liye
      });

      alert("🎉 Sale Entry Saved to Firebase!");
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
        <h2 className="form-title">Sales Entry (Cloud)</h2>

        <form onSubmit={handleSubmit} className="sales-form-grid">
          {/* Row 1 */}
          <div className="input-group">
            <label>SI No.</label>
            <input name="si" value={formData.si} onChange={handleChange} />
          </div>
          <div className="input-group">
            <label>Date</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} />
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
              {loading ? "Saving..." : "✅ Save to Firebase"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SalesEntry;