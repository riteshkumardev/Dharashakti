import React, { useState, useEffect } from 'react';
import "./Stock.css";
import { getDatabase, ref, onValue, remove, update } from "firebase/database";
import { app } from "../../redux/api/firebase/firebase";
import Alert from "../Alert/Alert"; 

const StockManagement = () => {
  const db = getDatabase(app);
  
  const [stocks, setStocks] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
const [alertData, setAlertData] = useState({
  show: false,
  title: "",
  message: "",
  type: "info", // "info" (sirf OK) ya "confirm" (Yes/No)
  onConfirm: null, // Confirm hone par jo function chalega
});

  const showAlert = (title, message) => {
    setAlertData({ show: true, title, message });
  };

  const closeAlert = () => {
    setAlertData((prev) => ({ ...prev, show: false }));
  };

  useEffect(() => {
    const stockRef = ref(db, "stocks");
    const unsubscribe = onValue(stockRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setStocks(list.reverse());
      } else {
        setStocks([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [db]);

// 🗑️ Delete Logic
const handleDelete = (id) => {
  setAlertData({
    show: true,
    title: "Confirm Delete 🗑️",
    message: "Kya aap sach mein is item ko delete karna chahte hain?",
    type: "confirm", 
    onConfirm: () => executeDelete(id), // Agar user "Yes" kare toh ye function chale
  });
};

// Asli Delete Function
const executeDelete = (id) => {
  remove(ref(db, `stocks/${id}`))
    .then(() => {
      showAlert("Deleted!", "Item successfully delete ho gaya.");
    })
    .catch((err) => showAlert("Error ❌", err.message));
};

  const startEdit = (stock) => {
    setEditId(stock.id);
    setEditData({ ...stock });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  // ✅ Save Logic (Updated: Removed standard alert)
  const handleSave = async () => {
    try {
      const itemRef = ref(db, `stocks/${editId}`);
      await update(itemRef, {
        ...editData,
        quantity: Number(editData.quantity),
        updatedDate: new Date().toISOString().split("T")[0]
      });
      setEditId(null);
      showAlert("Success ✅", "Stock database mein update ho gaya hai!"); 
    } catch (err) {
      showAlert("Update Failed ❌", err.message); // alert() ki jagah showAlert
    }
  };

  const filteredStocks = stocks.filter(s => 
    s.item?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="no-records-box">Loading Live Inventory...</div>;

  return (
    <>
      <div className="table-container-wide">
        <div className="table-card-wide">
          <div className="table-header-row">
            <h2 className="table-title">STOCK INVENTORY (LIVE)</h2>
            <div className="search-wrapper">
              <span className="search-icon">🔍</span>
              <input
                className="table-search-box"
                placeholder="Search Item Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="table-responsive-wrapper">
            <table className="modern-sales-table">
              <thead>
                <tr>
                  <th>SI No.</th>
                  <th>Item Name</th>
                  <th>Quantity</th>
                  <th>Unit</th>
                  <th>Last Updated</th>
                  <th>Remarks</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.map((stock, index) => {
                  const isLow = stock.quantity < 50;
                  const isEditing = editId === stock.id;

                  return (
                    <tr key={stock.id} className={isEditing ? "active-edit-row" : isLow ? "low-stock-bg" : ""}>
                      <td>{index + 1}</td>
                      <td>{isEditing ? <input name="item" value={editData.item} onChange={handleEditChange} className="edit-input-field" /> : stock.item}</td>
                      <td className="bold-cell">{isEditing ? <input type="number" name="quantity" value={editData.quantity} onChange={handleEditChange} className="edit-input-field small-input" /> : stock.quantity}</td>
                      <td>
                        {isEditing ? (
                          <select name="unit" value={editData.unit} onChange={handleEditChange} className="edit-input-field">
                            <option value="kg">kg</option>
                            <option value="Bags">Bags</option>
                            <option value="Pcs">Pcs</option>
                            <option value="Tons">Tons</option>
                          </select>
                        ) : <span className="unit-badge">{stock.unit}</span>}
                      </td>
                      <td>{stock.updatedDate}</td>
                      <td>{isEditing ? <input name="remarks" value={editData.remarks} onChange={handleEditChange} className="edit-input-field" /> : stock.remarks}</td>
                      <td>
                        <span className={`status-badge-pill ${stock.quantity <= 0 ? 'null-bg' : isLow ? 'warning-bg' : 'success-bg'}`}>
                          {stock.quantity <= 0 ? 'Out of Stock' : isLow ? 'Low Stock' : 'Available'}
                        </span>
                      </td>
                      <td className="action-btns-cell">
                        {isEditing ? (
                          <>
                            <button className="save-btn-ui" onClick={handleSave}>Save</button>
                            <button className="cancel-btn-ui" onClick={() => setEditId(null)}>✖</button>
                          </>
                        ) : (
                          <>
                            <button className="row-edit-btn" onClick={() => startEdit(stock)}>✏️</button>
                            <button className="row-delete-btn" onClick={() => handleDelete(stock.id)}>🗑️</button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredStocks.length === 0 && <div className="no-records-box">No Stock Data Found.</div>}
          </div>
        </div>
      </div>

      {/* 🔔 Custom Alert */}
      <Alert
        show={alertData.show}
        title={alertData.title}
        message={alertData.message}
        onClose={closeAlert}
      />
    </>
  );
};

export default StockManagement;