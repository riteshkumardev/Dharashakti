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
import Alert from "../Core_Component/Alert/Alert";

// 👈 role prop add kiya gaya hai
const SalesEntry = ({ role }) => {
  const db = getDatabase(app);

  // 🔐 Permission Check: Sirf Admin aur Accountant submit kar sakte hain
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

  const [alertData, setAlertData] = useState({
    show: false,
    title: "",
    message: "",
  });

  const showAlert = (title, message) => {
    setAlertData({ show: true, title, message });
  };

  const closeAlert = () => {
    setAlertData((prev) => ({ ...prev, show: false }));
  };

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

  useEffect(() => {
    const total =
      (Number(formData.quantity) || 0) *
      (Number(formData.rate) || 0);
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

  const handleReset = () => setFormData(initialState);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Extra security check
    if (!isAuthorized) {
      showAlert("Unauthorized ❌", "Aapko data save karne ki permission nahi hai.");
      return;
    }

    setLoading(true);

    try {
      const salesRef = ref(db, "sales");
      const newSaleRef = push(salesRef);

      await set(newSaleRef, {
        ...formData,
        si: nextSi,
        timestamp: Date.now(),
      });

      showAlert(
        "Sale Saved Successfully 🎉",
        `SI No: ${nextSi}\nDue Date: ${formData.billDueDate}`
      );

      handleReset();
    } catch (error) {
      console.error(error);
      showAlert(
        "Error ❌",
        "Data save nahi ho paya. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="sales-container">
        <div className="sales-card-wide">
          <div
            className="form-header-flex"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2 className="form-title">Sales Entry (Cloud)</h2>

            <div style={{ display: "flex", gap: "10px" }}>
              <div className="si-badge">
                SI No: {nextSi}
              </div>
              <div className="due-badge">
                Due: {formData.billDueDate}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="sales-form-grid">
            {/* ... Sare input fields same rahenge jaise pehle the ... */}
            <div className="input-group">
              <label>Date</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} />
            </div>

            <div className="input-group">
              <label>Product Name</label>
              <select name="productName" value={formData.productName} onChange={handleChange} required>
                <option value="">Select Product</option>
                <option value="Corn Grit">Corn Grit</option>
                <option value="Cattle Feed">Cattle Feed</option>
                <option value="Rice Grit">Rice Grit</option>
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
              <input value={formData.totalPrice} readOnly />
            </div>

            <div className="input-group">
              <label>Amount Received</label>
              <input type="number" name="amountReceived" value={formData.amountReceived} onChange={handleChange} />
            </div>

            <div className="input-group readonly-group">
              <label>Payment Due</label>
              <input value={formData.paymentDue} readOnly />
            </div>

            <div className="input-group span-2">
              <label>Remarks</label>
              <input name="remarks" value={formData.remarks} onChange={handleChange} />
            </div>

            <div className="button-container-full">
              <button
                type="button"
                onClick={handleReset}
                className="btn-reset-3d"
                disabled={!isAuthorized} // 👈 Disable if not Admin/Accountant
                title={!isAuthorized ? "Aapko Reset karne ki permission nahi hai" : ""}
                style={{ opacity: isAuthorized ? 1 : 0.6, cursor: isAuthorized ? "pointer" : "not-allowed" }}
              >
                Reset
              </button>
              
              <button
                type="submit"
                className="btn-submit-colored"
                disabled={loading || !isAuthorized} // 👈 Disable if not Admin/Accountant
                title={!isAuthorized ? "Sirf Admin aur Accountant hi entry save kar sakte hain" : ""}
                style={{ opacity: isAuthorized ? 1 : 0.6, cursor: isAuthorized ? "pointer" : "not-allowed" }}
              >
                {loading ? "Saving..." : !isAuthorized ? "🔒 Read Only" : "✅ Save Sale"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <Alert
        show={alertData.show}
        title={alertData.title}
        message={alertData.message}
        onClose={closeAlert}
      />
    </>
  );
};

export default SalesEntry;