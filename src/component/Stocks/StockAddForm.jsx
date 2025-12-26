import React, { useState } from 'react';
import "./Stock.css";
import { getDatabase, ref, push, set } from "firebase/database";
import { app } from "../../redux/api/firebase/firebase"; 
import Alert from "../Core_Component/Alert/Alert"; // 👈 Alert Import karein

const StockAddForm = ({ onCancel }) => {
  const db = getDatabase(app);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    item: "",
    quantity: "",
    unit: "kg",
    remarks: "",
  });

  /* 🔔 Alert State */
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
    // Agar success ke baad form band karna hai toh yahan logic daal sakte hain
  };

  const productList = [
    "Corn",
    "Corn Greet",
    "Cattlefeed",
    "Aatarice",
    "Rice Greet",
    "Packing Bag",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.item || !formData.quantity) {
      showAlert("Validation ⚠️", "Please select an item and enter quantity");
      return;
    }

    setLoading(true);

    try {
      const stockRef = ref(db, "stocks");
      const newStockRef = push(stockRef);

      const stockEntry = {
        ...formData,
        quantity: Number(formData.quantity),
        updatedDate: new Date().toISOString().split("T")[0],
        createdAt: new Date().toISOString(),
      };

      await set(newStockRef, stockEntry);

      // Reset Form
      setFormData({
        item: "",
        quantity: "",
        unit: "kg",
        remarks: "",
      });

      // Show Success Alert
      showAlert("Success 🎉", "Stock Entry Updated Successfully!");

      // Optional: thodi der baad onCancel() call karein ya Alert close hone par
      // if (onCancel) setTimeout(onCancel, 2000); 

    } catch (error) {
      console.error("Firebase Error:", error);
      showAlert("Error ❌", "Stock update nahi ho paya. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="table-container-wide">
        <div className="table-card-wide no-scroll-card">
          <div className="form-header-row">
            <h2 className="table-title">STOCK ENTRY FORM (FIREBASE)</h2>
            <p className="subtitle">Update your inventory levels efficiently</p>
          </div>

          <form onSubmit={handleSubmit} className="stock-form-grid">
            <div className="input-group">
              <label>Select Product</label>
              <select
                value={formData.item}
                onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                required
                className="styled-select"
                disabled={loading}
              >
                <option value="">-- Choose Product --</option>
                {productList.map((product, index) => (
                  <option key={index} value={product}>{product}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label>Quantity</label>
              <input
                type="number"
                placeholder="0.00"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="input-group">
              <label>Unit</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="styled-select"
                disabled={loading}
              >
                <option value="kg">kg</option>
                <option value="Bags">Bags</option>
                <option value="Pcs">Pcs</option>
                <option value="Tons">Tons</option>
              </select>
            </div>

            <div className="input-group">
              <label>Updated Date</label>
              <input 
                type="text" 
                value={new Date().toISOString().split("T")[0]} 
                readOnly 
                className="readonly-input" 
              />
            </div>

            <div className="input-group span-4">
              <label>Remarks / Notes</label>
              <input
                placeholder="Any notes about this stock..."
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                disabled={loading}
              />
            </div>

            <div className="button-container-full">
              <button 
                type="button" 
                className="btn-reset-3d" 
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-submit-colored"
                disabled={loading}
              >
                {loading ? "Updating..." : "✅ Update Stock"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 🔔 Advanced Alert */}
      <Alert
        show={alertData.show}
        title={alertData.title}
        message={alertData.message}
        onClose={closeAlert}
      />
    </>
  );
};

export default StockAddForm;