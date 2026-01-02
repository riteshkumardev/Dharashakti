import React, { useState, useEffect } from "react";
import "./Sales.css";
import axios from "axios"; // 🛠️ MongoDB Integration
import Loader from "../Core_Component/Loader/Loader";
import Alert from "../Core_Component/Alert/Alert";

const SalesTable = ({ role }) => {
  const isAuthorized = role === "Admin" || role === "Accountant";

  const [salesList, setSalesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("All");
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [sortBy, setSortBy] = useState("dateNewest");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const [alertData, setAlertData] = useState({ show: false, title: "", message: "" });

  const showAlert = (title, message) => setAlertData({ show: true, title, message });
  const closeAlert = () => setAlertData((prev) => ({ ...prev, show: false }));

  // 1️⃣ Fetch Data from MongoDB
  const fetchSales = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/sales");
      if (res.data.success) {
        setSalesList(res.data.data);
      }
    } catch (err) {
      showAlert("Error", "Server se data nahi mil raha.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  // 2️⃣ Auto Calculation in Edit Mode
  useEffect(() => {
    if (editId) {
      const total = (Number(editData.quantity) || 0) * (Number(editData.rate) || 0);
      const due = total - (Number(editData.amountReceived) || 0);
      setEditData((prev) => ({ ...prev, totalPrice: total, paymentDue: due }));
    }
  }, [editData.quantity, editData.rate, editData.amountReceived, editId]);

  // 3️⃣ Filter & Sort Logic
  const getProcessedList = () => {
    let list = salesList.filter((s) => {
      const matchesSearch =
        s.customerName?.toLowerCase().includes(search.toLowerCase()) ||
        s.billNo?.toLowerCase().includes(search.toLowerCase());
      const matchesProduct = selectedProduct === "All" || s.productName === selectedProduct;
      return matchesSearch && matchesProduct;
    });

    list.sort((a, b) => {
      if (sortBy === "dateNewest") return new Date(b.date) - new Date(a.date);
      if (sortBy === "dateOldest") return new Date(a.date) - new Date(b.date);
      if (sortBy === "billAsc") return String(a.billNo).localeCompare(String(b.billNo), undefined, { numeric: true });
      if (sortBy === "billDesc") return String(b.billNo).localeCompare(String(a.billNo), undefined, { numeric: true });
      return 0;
    });
    return list;
  };

  const processedList = getProcessedList();
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = processedList.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(processedList.length / rowsPerPage);

  // 4️⃣ Actions
  // 4️⃣ Actions
// 4️⃣ Actions (Clean Version: Only Browser Popup)
  const handleDelete = async (id) => {
    // Permission check
    if (!isAuthorized) {
      alert("Denied ❌: Aapke paas delete karne ki permission nahi hai.");
      return;
    }

    // Sirf window popup confirmation लेगा
    const isConfirmed = window.confirm("Kya aap sach me delete karna chahte hain?");
    
    // Agar user ne OK nahi kiya toh function yahi ruk jayega
    if (!isConfirmed) return;

    try {
      setLoading(true);
      const res = await axios.delete(`http://localhost:5000/api/sales/${id}`);
      
      if (res.data.success) {
        // Successful delete ke baad bhi humne showAlert hata diya hai
        // Taki extra popup na aaye. Bas data refresh ho jayega.
        fetchSales(); 
      }
    } catch (err) {
      console.error(err);
      alert("Error ❌: Record delete nahi ho paya.");
    } finally {
      setLoading(false);
    }
  };
  const handleSave = async () => {
    try {
      const res = await axios.put(`http://localhost:5000/api/sales/${editId}`, editData);
      if (res.data.success) {
        showAlert("Updated! ✅", "Record update ho gaya.");
        setEditId(null);
        fetchSales();
      }
    } catch (err) {
      showAlert("Error ❌", "Update fail ho gaya.");
    }
  };

  const startEdit = (sale) => {
    if (!isAuthorized) {
      showAlert("Denied ❌", "Permission Denied.");
      return;
    }
    setEditId(sale._id); // MongoDB uses _id
    setEditData({ ...sale });
  };

  if (loading) return <Loader />;

  return (
    <>
      <div className="table-container-wide">
        <div className="table-card-wide">
          <div className="table-header-flex">
            <h2 className="table-title">SALES RECORDS (MongoDB)</h2>
            <div className="table-controls-row">
              <select className="table-select-custom" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="dateNewest">Newest Date</option>
                <option value="dateOldest">Oldest Date</option>
                <option value="billAsc">Bill No (L to H)</option>
                <option value="billDesc">Bill No (H to L)</option>
              </select>

              <select className="table-select-custom" value={selectedProduct} onChange={(e) => { setSelectedProduct(e.target.value); setCurrentPage(1); }}>
                <option value="All">All Products</option>
                <option value="Corn Grit">Corn Grit</option>
                <option value="Cattle Feed">Cattle Feed</option>
                <option value="Rice Grit">Rice Grit</option>
                <option value="Corn Flour">Corn Flour</option>
              </select>

              <input className="table-search-input" placeholder="Search Customer..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
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
                  <th>Total</th>
                  <th>Received</th>
                  <th>Due</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.map((sale) => (
                  <tr key={sale._id} className={editId === sale._id ? "active-edit" : ""}>
                    <td>{editId === sale._id ? <input type="date" name="date" value={editData.date} onChange={(e) => setEditData({...editData, date: e.target.value})} /> : sale.date}</td>
                    <td>{editId === sale._id ? <input name="billNo" value={editData.billNo} onChange={(e) => setEditData({...editData, billNo: e.target.value})} /> : <span className="bill-tag">{sale.billNo}</span>}</td>
                    <td>{sale.productName}</td>
                    <td>{editId === sale._id ? <input name="customerName" value={editData.customerName} onChange={(e) => setEditData({...editData, customerName: e.target.value})} /> : sale.customerName}</td>
                    <td>{editId === sale._id ? <input type="number" name="quantity" value={editData.quantity} onChange={(e) => setEditData({...editData, quantity: e.target.value})} /> : sale.quantity}</td>
                    <td>₹{editId === sale._id ? editData.totalPrice : sale.totalPrice}</td>
                    <td>₹{editId === sale._id ? <input type="number" name="amountReceived" value={editData.amountReceived} onChange={(e) => setEditData({...editData, amountReceived: e.target.value})} /> : sale.amountReceived}</td>
                    <td style={{color: 'red'}}>₹{editId === sale._id ? editData.paymentDue : sale.paymentDue}</td>
                    <td>{sale.billDueDate}</td>
                    <td>
                      {editId === sale._id ? (
                        <><button onClick={handleSave}>💾</button> <button onClick={() => setEditId(null)}>✖</button></>
                      ) : (
                        <><button onClick={() => startEdit(sale)} disabled={!isAuthorized}>✏️</button> <button onClick={() => handleDelete(sale._id)} disabled={!isAuthorized}>🗑️</button></>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination-container">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="pg-btn">◀ Prev</button>
            <span className="pg-info">Page {currentPage} of {totalPages || 1}</span>
            <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)} className="pg-btn">Next ▶</button>
          </div>
        </div>
      </div>
      <Alert show={alertData.show} title={alertData.title} message={alertData.message} onClose={closeAlert} />
    </>
  );
};

export default SalesTable;