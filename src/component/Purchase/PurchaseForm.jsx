import React, { useState } from 'react';
import './Purchase.css';
// 1. Firebase functions import karein
import { getDatabase, ref, push, set } from "firebase/database";
import { app } from "../../redux/api/firebase/firebase";

const PurchaseForm = ({ onCancel }) => {
  const db = getDatabase(app); // Database instance initialize karein

  const [formData, setFormData] = useState({
    item: '',
    quantity: '',
    unit: 'kg',
    remarks: ''
  });

  const [loading, setLoading] = useState(false);

  const productList = ["Corn", "Corn Greet", "Cattlefeed", "Aatarice", "Rice Greet", "Packing Bag"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 2. Data object taiyar karein
    const purchaseEntry = {
      ...formData,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().getTime()
    };

    try {
      // 3. Firebase mein 'purchases' node ke andar data push karein
      const purchaseRef = ref(db, "purchases");
      const newEntryRef = push(purchaseRef);
      
      await set(newEntryRef, purchaseEntry);

      alert("🎉 Purchase Stock Saved to Firebase Successfully!");
      
      // Form reset karein
      setFormData({ item: '', quantity: '', unit: 'kg', remarks: '' });
      
      if (onCancel) onCancel(); // Form band karne ke liye (agar modal mein hai)

    } catch (error) {
      console.error("Firebase Error:", error);
      alert("❌ Error: Data save nahi ho paya.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="table-container-wide">
      <div className="table-card-wide no-scroll-card">
        <div className="form-header-row">
          <h2 className="table-title">PURCHASE ENTRY FORM (CLOUD)</h2>
          <p className="subtitle">Add new inventory stock directly to Firebase</p>
        </div>

        <form onSubmit={handleSubmit} className="purchase-form-grid">
          <div className="input-group">
            <label>Item Name</label>
            <select 
              value={formData.item} 
              onChange={(e) => setFormData({...formData, item: e.target.value})} 
              required
              className="styled-select"
            >
              <option value="">-- Select Product --</option>
              {productList.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="input-group">
            <label>Quantity</label>
            <input 
              type="number" 
              value={formData.quantity} 
              onChange={(e) => setFormData({...formData, quantity: e.target.value})} 
              required 
              placeholder="0.00" 
            />
          </div>

          <div className="input-group">
            <label>Unit</label>
            <select 
              value={formData.unit} 
              onChange={(e) => setFormData({...formData, unit: e.target.value})}
              className="styled-select"
            >
              <option value="kg">kg</option>
              <option value="Bags">Bags</option>
              <option value="Tons">Tons</option>
              <option value="Pcs">Pcs</option>
            </select>
          </div>

          <div className="input-group">
            <label>Purchase Date</label>
            <input 
              type="text" 
              value={new Date().toISOString().split('T')[0]} 
              readOnly 
              className="readonly-input" 
            />
          </div>

          <div className="input-group span-4">
            <label>Remarks / Notes</label>
            <input 
              type="text"
              name="remarks"
              placeholder="Enter purchase details..." 
              value={formData.remarks} 
              onChange={(e) => setFormData({...formData, remarks: e.target.value})} 
            />
          </div>

          <div className="button-container-full">
            <button type="button" className="btn-reset-3d" onClick={onCancel} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-submit-colored" disabled={loading}>
              {loading ? "Saving..." : "✅ Save Purchase Stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PurchaseForm;