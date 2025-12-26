import React, { useState } from 'react';
import './Purchase.css';
import { getDatabase, ref, push, set } from "firebase/database";
import { app } from "../../redux/api/firebase/firebase";
import Alert from "../Core_Component/Alert/Alert";

// 👈 role prop add kiya gaya hai
const PurchaseForm = ({ onCancel, role }) => {
  const db = getDatabase(app);

  // 🔐 Permission Check: Sirf Admin aur Accountant submit kar sakte hain
  const isAuthorized = role === "Admin" || role === "Accountant";

  const [formData, setFormData] = useState({
    item: '',
    quantity: '',
    unit: 'kg',
    remarks: ''
  });

  const [loading, setLoading] = useState(false);

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
  };

  const productList = ["Corn", "Corn Greet", "Cattlefeed", "Aatarice", "Rice Greet", "Packing Bag"];

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🛑 Security Check
    if (!isAuthorized) {
      showAlert("Unauthorized ❌", "Aapko purchase entry save karne ki permission nahi hai.");
      return;
    }

    setLoading(true);

    const purchaseEntry = {
      ...formData,
      quantity: Number(formData.quantity),
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().getTime()
    };

    try {
      const purchaseRef = ref(db, "purchases");
      const newEntryRef = push(purchaseRef);
      
      await set(newEntryRef, purchaseEntry);

      showAlert("Success 🎉", "Purchase Stock Saved Successfully!");
      
      setFormData({ item: '', quantity: '', unit: 'kg', remarks: '' });

    } catch (error) {
      console.error("Firebase Error:", error);
      showAlert("Error ❌", "Data save nahi ho paya. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
                disabled={loading || !isAuthorized} // 👈 Disable if not authorized
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
                disabled={loading || !isAuthorized} // 👈 Disable if not authorized
              />
            </div>

            <div className="input-group">
              <label>Unit</label>
              <select 
                value={formData.unit} 
                onChange={(e) => setFormData({...formData, unit: e.target.value})}
                className="styled-select"
                disabled={loading || !isAuthorized} // 👈 Disable if not authorized
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
                disabled={loading || !isAuthorized} // 👈 Disable if not authorized
              />
            </div>

            <div className="button-container-full">
              <button type="button" className="btn-reset-3d" onClick={onCancel} disabled={loading}>
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-submit-colored" 
                disabled={loading || !isAuthorized} // 👈 Permission Guard
                title={!isAuthorized ? "Permission required" : "Save data"}
                style={{ 
                  opacity: isAuthorized ? 1 : 0.6, 
                  cursor: isAuthorized ? "pointer" : "not-allowed" 
                }}
              >
                {loading ? "Saving..." : !isAuthorized ? "🔒 Read Only" : "✅ Save Purchase Stock"}
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

export default PurchaseForm;