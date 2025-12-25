import React, { useState, useEffect } from "react";
import "./Sales.css";
// 1. Firebase imports
import { getDatabase, ref, onValue, remove, update } from "firebase/database";
import { app } from "../../redux/api/firebase/firebase";

const SalesTable = () => {
  const db = getDatabase(app);
  const [salesList, setSalesList] = useState([]); // State for Firebase data
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});

  // 2. Fetch Data from Firebase on Mount
  useEffect(() => {
    const salesRef = ref(db, "sales");
    
    // onValue real-time updates sunta hai
    const unsubscribe = onValue(salesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Firebase object ko array mein convert karna (taaki map chal sake)
        const list = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setSalesList(list.reverse()); // Latest entries upar dikhane ke liye
      } else {
        setSalesList([]);
      }
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup listener
  }, [db]);

  const filteredList = salesList.filter(s =>
    s.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    s.billNo?.toLowerCase().includes(search.toLowerCase())
  );

  // 🗑️ Delete from Firebase
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      remove(ref(db, `sales/${id}`))
        .then(() => alert("Record Deleted!"))
        .catch((err) => console.error("Delete Error:", err));
    }
  };

  // ✏️ Edit Functions
  const startEdit = (sale) => {
    setEditId(sale.id);
    setEditData({ ...sale });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  // ✅ Save Changes to Firebase
  const handleSave = () => {
    const updates = {};
    updates[`/sales/${editId}`] = editData;

    update(ref(db), updates)
      .then(() => {
        alert("Update Successful!");
        setEditId(null);
      })
      .catch((err) => console.error("Update Error:", err));
  };

  if (loading) return <div className="no-records-box">Loading Sales Data...</div>;

  return (
    <div className="table-container-wide">
      <div className="table-card-wide">
        <div className="table-header-row">
          <h2 className="table-title">SALES MANAGEMENT (LIVE)</h2>
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input
              className="table-search-box"
              placeholder="Search Customer or Bill No..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-responsive-wrapper">
          {filteredList.length === 0 ? (
            <div className="no-records-box">No sales records found</div>
          ) : (
            <table className="modern-sales-table">
              <thead>
                <tr>
                  <th>SI No</th>
                  <th>Date</th>
                  <th>Bill No</th>
                  <th>Customer Name</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Total</th>
                  <th>Received</th>
                  <th>Due</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((sale, index) => (
                  <tr key={sale.id} className={editId === sale.id ? "active-edit" : ""}>
                    <td>{index + 1}</td>
                    <td>{editId === sale.id ? <input type="date" name="date" value={editData.date} onChange={handleEditChange} className="edit-input-field" /> : sale.date}</td>
                    <td><span className="bill-tag">{sale.billNo}</span></td>
                    <td className="cust-name-cell">
                      {editId === sale.id ? <input name="customerName" value={editData.customerName} onChange={handleEditChange} className="edit-input-field" /> : sale.customerName}
                    </td>
                    <td>{editId === sale.id ? <input type="number" name="quantity" value={editData.quantity} onChange={handleEditChange} className="edit-input-field small-input" /> : sale.quantity}</td>
                    <td>₹{sale.rate}</td>
                    <td className="bold-cell">₹{sale.totalPrice}</td>
                    <td className="success-text">₹{sale.amountReceived}</td>
                    <td className="danger-text">₹{sale.paymentDue}</td>

                    <td className="action-btns-cell">
                      {editId === sale.id ? (
                        <>
                          <button className="save-btn-ui" onClick={handleSave}>💾 Save</button>
                          <button className="cancel-btn-ui" onClick={() => setEditId(null)}>✖</button>
                        </>
                      ) : (
                        <>
                          <button className="row-edit-btn" onClick={() => startEdit(sale)}>✏️</button>
                          <button className="row-delete-btn" onClick={() => handleDelete(sale.id)}>🗑️</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesTable;