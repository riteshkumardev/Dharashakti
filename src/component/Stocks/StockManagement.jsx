import React, { useState, useEffect } from 'react';
import "./Stock.css";
// 1. Firebase Imports
import { getDatabase, ref, onValue, remove, update } from "firebase/database";
import { app } from "../../redux/api/firebase/firebase";

const StockManagement = () => {
  const db = getDatabase(app);
  
  // States
  const [stocks, setStocks] = useState([]); // Cloud data state
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});

  // 2. Fetch Data from Firebase (Live Listener)
  useEffect(() => {
    const stockRef = ref(db, "stocks");
    
    const unsubscribe = onValue(stockRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Firebase Object ko Array mein convert karna
        const list = Object.keys(data).map((key) => ({
          id: key, // Firebase ki unique key
          ...data[key],
        }));
        setStocks(list.reverse()); // New entries upar dikhane ke liye
      } else {
        setStocks([]);
      }
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup listener
  }, [db]);

  // 🗑️ Delete from Firebase
  const handleDelete = (id) => {
    if (window.confirm("Kya aap is stock item ko delete karna chahte hain?")) {
      remove(ref(db, `stocks/${id}`))
        .then(() => alert("🗑️ Stock Item Deleted!"))
        .catch((err) => alert("Error: " + err.message));
    }
  };

  // ✏️ Edit Logic
  const startEdit = (stock) => {
    setEditId(stock.id);
    setEditData({ ...stock });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  // ✅ Save Changes to Firebase
  const handleSave = async () => {
    try {
      const itemRef = ref(db, `stocks/${editId}`);
      await update(itemRef, {
        ...editData,
        quantity: Number(editData.quantity), // Ensure number format
        updatedDate: new Date().toISOString().split("T")[0]
      });
      setEditId(null);
      alert("✅ Stock Updated in Database!");
    } catch (err) {
      alert("Update Failed: " + err.message);
    }
  };

  // 🔍 Filter Logic
  const filteredStocks = stocks.filter(s => 
    s.item?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="no-records-box">Loading Live Inventory...</div>;

  return (
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
                    
                    <td>
                      {isEditing ? <input name="item" value={editData.item} onChange={handleEditChange} className="edit-input-field" /> : stock.item}
                    </td>

                    <td className="bold-cell">
                      {isEditing ? <input type="number" name="quantity" value={editData.quantity} onChange={handleEditChange} className="edit-input-field small-input" /> : stock.quantity}
                    </td>

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

                    <td>
                      {isEditing ? <input name="remarks" value={editData.remarks} onChange={handleEditChange} className="edit-input-field" /> : stock.remarks}
                    </td>

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
  );
};

export default StockManagement;