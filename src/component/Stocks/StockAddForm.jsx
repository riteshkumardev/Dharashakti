import React, { useState } from "react";
import { getDatabase, ref, push, set } from "firebase/database";
import { app } from "../../redux/api/firebase/firebase";
import Alert from "../Core_Component/Alert/Alert";

const  StockAddForm= ({ role }) => { // 👈 Prop received
  const db = getDatabase(app);

  // 🔐 Permission Guard
  const isAuthorized = role === "Admin" || role === "Accountant";

  const initialState = {
    date: new Date().toISOString().split("T")[0],
    supplierName: "",
    itemName: "",
    billNo: "",
    quantity: "",
    rate: "",
    totalAmount: 0,
    paidAmount: "",
    balanceAmount: 0,
    remarks: "",
  };

  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [alertData, setAlertData] = useState({ show: false, title: "", message: "" });

  const showAlert = (title, message) => setAlertData({ show: true, title, message });
  const closeAlert = () => setAlertData((prev) => ({ ...prev, show: false }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedData = { ...formData, [name]: value };

    if (name === "quantity" || name === "rate" || name === "paidAmount") {
      const total = (Number(updatedData.quantity) || 0) * (Number(updatedData.rate) || 0);
      const balance = total - (Number(updatedData.paidAmount) || 0);
      updatedData.totalAmount = total;
      updatedData.balanceAmount = balance;
    }
    setFormData(updatedData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 🛑 Logic Guard
    if (!isAuthorized) {
      showAlert("Denied ❌", "Aapko purchase entry karne ki permission nahi hai.");
      return;
    }

    setLoading(true);
    try {
      const purchaseRef = ref(db, "purchases");
      await push(purchaseRef, { ...formData, timestamp: Date.now() });
      showAlert("Success ✅", "Purchase record save ho gaya.");
      setFormData(initialState);
    } catch (error) {
      showAlert("Error ❌", "Data save nahi ho saka.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="sales-container">
        <div className="sales-card-wide">
          <h2 className="form-title">Purchase Entry</h2>
          <form onSubmit={handleSubmit} className="sales-form-grid">
            
            {/* Inputs - Sabhi ko disabled={!isAuthorized} kar sakte hain agar form touch bhi nahi karne dena */}
            <div className="input-group">
              <label>Date</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} disabled={!isAuthorized} />
            </div>

            <div className="input-group">
              <label>Supplier Name</label>
              <input name="supplierName" value={formData.supplierName} onChange={handleChange} required disabled={!isAuthorized} />
            </div>

            <div className="input-group">
              <label>Item Name</label>
              <input name="itemName" value={formData.itemName} onChange={handleChange} required disabled={!isAuthorized} />
            </div>

            <div className="input-group">
              <label>Bill No</label>
              <input name="billNo" value={formData.billNo} onChange={handleChange} required disabled={!isAuthorized} />
            </div>

            <div className="input-group">
              <label>Quantity</label>
              <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} disabled={!isAuthorized} />
            </div>

            <div className="input-group">
              <label>Rate</label>
              <input type="number" name="rate" value={formData.rate} onChange={handleChange} disabled={!isAuthorized} />
            </div>

            <div className="input-group readonly-group">
              <label>Total Amount</label>
              <input value={formData.totalAmount} readOnly />
            </div>

            <div className="input-group">
              <label>Paid Amount</label>
              <input type="number" name="paidAmount" value={formData.paidAmount} onChange={handleChange} disabled={!isAuthorized} />
            </div>

            <div className="input-group readonly-group">
              <label>Balance</label>
              <input value={formData.balanceAmount} readOnly />
            </div>

            <div className="button-container-full">
              <button 
                type="submit" 
                className="btn-submit-colored" 
                disabled={loading || !isAuthorized}
                style={{ opacity: isAuthorized ? 1 : 0.6 }}
              >
                {loading ? "Saving..." : !isAuthorized ? "🔒 Read Only" : "✅ Save Purchase"}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Alert show={alertData.show} title={alertData.title} message={alertData.message} onClose={closeAlert} />
    </>
  );
};

export default StockAddForm;