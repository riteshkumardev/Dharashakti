import React, { useState, useEffect } from "react";
import "./Sales.css";
import { getDatabase, ref, onValue, remove, update } from "firebase/database";
import { app } from "../../redux/api/firebase/firebase";

const SalesTable = () => {
  const db = getDatabase(app);
  const [salesList, setSalesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("All");
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});

  const [sortBy, setSortBy] = useState("dateNewest");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  useEffect(() => {
    const salesRef = ref(db, "sales");
    const unsubscribe = onValue(salesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setSalesList(list); 
      } else {
        setSalesList([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [db]);

  useEffect(() => {
    if (editId) {
      const total = (Number(editData.quantity) || 0) * (Number(editData.rate) || 0);
      const due = total - (Number(editData.amountReceived) || 0);
      setEditData(prev => ({ ...prev, totalPrice: total, paymentDue: due }));
    }
  }, [editData.quantity, editData.rate, editData.amountReceived, editId]);

  const getProcessedList = () => {
    let list = salesList.filter(s => {
      const matchesSearch = s.customerName?.toLowerCase().includes(search.toLowerCase()) ||
                           s.billNo?.toLowerCase().includes(search.toLowerCase());
      const matchesProduct = selectedProduct === "All" || s.productName === selectedProduct;
      return matchesSearch && matchesProduct;
    });

    list.sort((a, b) => {
      if (sortBy === "dateNewest") return new Date(b.date) - new Date(a.date);
      if (sortBy === "dateOldest") return new Date(a.date) - new Date(b.date);
      if (sortBy === "billAsc") return a.billNo.localeCompare(b.billNo, undefined, {numeric: true});
      if (sortBy === "billDesc") return b.billNo.localeCompare(a.billNo, undefined, {numeric: true});
      return 0;
    });
    return list;
  };

  const processedList = getProcessedList();
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = processedList.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(processedList.length / rowsPerPage);

  const handleDelete = (id) => {
    if (window.confirm("Delete this record?")) {
      remove(ref(db, `sales/${id}`)).catch(err => console.error(err));
    }
  };

  const startEdit = (sale) => {
    setEditId(sale.id);
    setEditData({ ...sale });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    update(ref(db), { [`/sales/${editId}`]: editData })
      .then(() => { alert("Updated!"); setEditId(null); })
      .catch(err => console.error(err));
  };

  if (loading) return <div className="no-records-box">Loading...</div>;

  return (
    <div className="table-container-wide">
      <div className="table-card-wide">
        
        {/* Updated Header with Side-by-Side Controls */}
        <div className="table-header-flex">
          <h2 className="table-title">SALES RECORDS</h2>
          
          <div className="table-controls-row">
            <select className="table-select-custom" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="dateNewest">Newest Date</option>
              <option value="dateOldest">Oldest Date</option>
              <option value="billAsc">Bill No (Low to High)</option>
              <option value="billDesc">Bill No (High to Low)</option>
            </select>

            <select className="table-select-custom" value={selectedProduct} onChange={(e) => {setSelectedProduct(e.target.value); setCurrentPage(1);}}>
              <option value="All">All Products</option>
              <option value="Corn Grit">Corn Grit</option>
              <option value="Cattle Feed">Cattle Feed</option>
              <option value="Rice Grit">Rice Grit</option>
              <option value="Corn Flour">Corn Flour</option>
              
            </select>

            <div className="search-input-wrapper">
              <input 
                className="table-search-input" 
                placeholder="Search Customer/Bill..." 
                value={search} 
                onChange={e => {setSearch(e.target.value); setCurrentPage(1);}} 
              />
            </div>
          </div>
        </div>

        <div className="table-responsive-wrapper">
          <table className="modern-sales-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Bill No</th>
                <th>Product</th>
                <th>Customer</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Total</th>
                <th>Received</th>
                <th>Due</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentRows.map((sale) => (
                <tr key={sale.id} className={editId === sale.id ? "active-edit" : ""}>
                  <td>{editId === sale.id ? <input type="date" name="date" value={editData.date} onChange={handleEditChange} className="edit-input-field" /> : sale.date}</td>
                  <td>{editId === sale.id ? <input name="billNo" value={editData.billNo} onChange={handleEditChange} className="edit-input-field" /> : <span className="bill-tag">{sale.billNo}</span>}</td>
                  <td>
                    {editId === sale.id ? (
                      <select name="productName" value={editData.productName} onChange={handleEditChange} className="edit-input-field">
                        <option value="Corn Grit">Corn Grit</option>
                        <option value="Cattle Feed">Cattle Feed</option>
                        <option value="Rice Grit">Rice Grit</option>
                        <option value="Corn Flour">Corn Flour</option>
                      </select>
                    ) : <strong>{sale.productName}</strong>}
                  </td>
                  <td>{editId === sale.id ? <input name="customerName" value={editData.customerName} onChange={handleEditChange} className="edit-input-field" /> : sale.customerName}</td>
                  <td>{editId === sale.id ? <input type="number" name="quantity" value={editData.quantity} onChange={handleEditChange} className="edit-input-field small-input" /> : sale.quantity}</td>
                  <td>₹{sale.rate}</td>
                  <td className="bold-cell">₹{editId === sale.id ? editData.totalPrice : sale.totalPrice}</td>
                  <td>₹{editId === sale.id ? <input type="number" name="amountReceived" value={editData.amountReceived} onChange={handleEditChange} className="edit-input-field small-input" /> : sale.amountReceived}</td>
                  <td className="danger-text">₹{editId === sale.id ? editData.paymentDue : sale.paymentDue}</td>
                  <td>{editId === sale.id ? <input type="date" name="billDueDate" value={editData.billDueDate} onChange={handleEditChange} className="edit-input-field" /> : sale.billDueDate}</td>
                  <td className="action-btns-cell">
                    {editId === sale.id ? (
                      <><button className="save-btn-ui" onClick={handleSave}>💾</button><button className="cancel-btn-ui" onClick={() => setEditId(null)}>✖</button></>
                    ) : (
                      <><button className="row-edit-btn" onClick={() => startEdit(sale)}>✏️</button><button className="row-delete-btn" onClick={() => handleDelete(sale.id)}>🗑️</button></>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pagination-container">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="pg-btn">◀ Prev</button>
          <span className="pg-info">Page {currentPage} of {totalPages || 1}</span>
          <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(prev => prev + 1)} className="pg-btn">Next ▶</button>
        </div>
      </div>
    </div>
  );
};

export default SalesTable;