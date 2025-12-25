import React, { useState } from 'react';
import "./Stock.css";
// 1. Firebase Imports
import { getDatabase, ref, push, set } from "firebase/database";
import { app } from "../../redux/api/firebase/firebase"; 

const StockAddForm = ({ onCancel }) => {
  const db = getDatabase(app); // Database instance
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    item: "",
    quantity: "",
    unit: "kg",
    remarks: "",
  });

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
      alert("Please select an item and enter quantity");
      return;
    }

    setLoading(true);

    try {
      // 2. Firebase 'stocks' node ka reference
      const stockRef = ref(db, "stocks");
      const newStockRef = push(stockRef); // Unique ID generate karega

      // 3. Data structure jo save hoga
      const stockEntry = {
        ...formData,
        quantity: Number(formData.quantity), // String ko number mein convert karein
        updatedDate: new Date().toISOString().split("T")[0],
        createdAt: new Date().toISOString(),
      };

      // 4. Firebase mein save karein
      await set(newStockRef, stockEntry);

      alert("🎉 Stock Entry Updated Successfully in Firebase!");

      // Form reset
      setFormData({
        item: "",
        quantity: "",
        unit: "kg",
        remarks: "",
      });

      // Agar modal band karna ho save ke baad
      if (onCancel) onCancel();

    } catch (error) {
      console.error("Firebase Error:", error);
      alert("❌ Error: Stock update nahi ho paya.");
    } finally {
      setLoading(false);
    }
  };

  return (
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
  );
};

export default StockAddForm;