import React, { useState, useEffect } from "react";
import "./Sales.css";
import axios from "axios"; 
import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

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
  const rowsPerPage = 5;

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showMsg = (msg, type = "success") => {
    setSnackbar({ open: true, message: msg, severity: type });
  };

  const fetchSales = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/sales`);
      if (res.data.success) {
        setSalesList(res.data.data);
      }
    } catch (err) {
      showMsg("Server se data nahi mil raha.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [API_URL]);

  // 2️⃣ Auto Calculation in Edit Mode (Travel और CD दोनों शामिल हैं)
  useEffect(() => {
  if (editId) {
    const qty = Number(editData.quantity) || 0;
    const rate = Number(editData.rate) || 0;
    const travel = Number(editData.travelingCost) || 0;
    const cdPercent = Number(editData.cashDiscount) || 0; // अब यह प्रतिशत (%) है

    // 1. बेस प्राइस निकालें (Qty * Rate)
    const basePrice = qty * rate;

    // 2. प्रतिशत के हिसाब से डिस्काउंट की राशि निकालें
    const discountAmount = (basePrice * cdPercent) / 100;

    // 3. नया लॉजिक: (बेस प्राइस) - ट्रेवल - डिस्काउंट राशि
    const total = basePrice - travel - discountAmount; 
    
    // 4. पेमेंट ड्यू निकालें
    const due = total - (Number(editData.amountReceived) || 0);

    setEditData((prev) => ({ 
      ...prev, 
      totalPrice: total, 
      paymentDue: due 
    }));
  }
}, [
  editData.quantity, 
  editData.rate, 
  editData.travelingCost, 
  editData.cashDiscount, 
  editData.amountReceived, 
  editId
]);

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

  const handleDelete = async (id) => {
    if (!isAuthorized) {
      showMsg("Denied ❌: Aapke paas permission nahi hai.", "error");
      return;
    }
    const isConfirmed = window.confirm("Kya aap sach me delete karna chahte hain?");
    if (!isConfirmed) return;

    try {
      setLoading(true);
      const res = await axios.delete(`${API_URL}/api/sales/${id}`);
      if (res.data.success) {
        showMsg("Record Deleted Successfully! 🗑️", "success");
        fetchSales(); 
      }
    } catch (err) {
      showMsg("Error ❌: Record delete nahi ho paya.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const res = await axios.put(`${API_URL}/api/sales/${editId}`, editData);
      if (res.data.success) {
        showMsg("Updated! ✅ Record update ho gaya.");
        setEditId(null);
        fetchSales();
      }
    } catch (err) {
      showMsg("Error ❌ Update fail ho gaya.", "error");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (sale) => {
    if (!isAuthorized) {
      showMsg("Denied ❌ Permission Required.", "warning");
      return;
    }
    setEditId(sale._id); 
    setEditData({ ...sale });
  };

  if (loading) return <Loader />;

  return (
    <>
      <div className="table-container-wide">
        <div className="table-card-wide">
          <div className="table-header-flex">
            <h2 className="table-title">SALES RECORDS</h2>
            <div className="table-controls-row">
              {/* ... Selects and Search Input ... */}
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
                  <th>Customer</th>
                  <th>Qty</th>
                  <th>Travel</th>
                  <th>CD (₹)</th> {/* 🆕 New Header for CD */}
                  <th>Total</th>
                  <th>Received</th>
                  <th>Due</th>
                  <th>Due Date</th>
                  <th>Remarks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.map((sale) => (
                  <tr key={sale._id} className={editId === sale._id ? "active-edit" : ""}>
                    <td>{editId === sale._id ? <input type="date" value={editData.date} onChange={(e) => setEditData({...editData, date: e.target.value})} /> : sale.date}</td>
                    <td>{editId === sale._id ? <input value={editData.billNo} onChange={(e) => setEditData({...editData, billNo: e.target.value})} /> : <span className="bill-tag">{sale.billNo}</span>}</td>
                    <td>{editId === sale._id ? <input value={editData.customerName} onChange={(e) => setEditData({...editData, customerName: e.target.value})} /> : sale.customerName}</td>
                    <td>{editId === sale._id ? <input type="number" value={editData.quantity} onChange={(e) => setEditData({...editData, quantity: e.target.value})} /> : sale.quantity}</td>
                    
                    <td>
                        {editId === sale._id ? 
                        <input type="number" value={editData.travelingCost} onChange={(e) => setEditData({...editData, travelingCost: e.target.value})} /> 
                        : `₹${sale.travelingCost || 0}`}
                    </td>

                    {/* 🆕 Cash Discount Row */}
                    <td>
                        {editId === sale._id ? 
                        <input type="number" value={editData.cashDiscount} onChange={(e) => setEditData({...editData, cashDiscount: e.target.value})} placeholder="CD" /> 
                        : `₹${sale.cashDiscount || 0}`}
                    </td>

                    <td style={{fontWeight: 'bold'}}>₹{editId === sale._id ? editData.totalPrice : sale.totalPrice}</td>
                    <td>{editId === sale._id ? <input type="number" value={editData.amountReceived} onChange={(e) => setEditData({...editData, amountReceived: e.target.value})} /> : `₹${sale.amountReceived}`}</td>
                    <td style={{color: 'red', fontWeight: 'bold'}}>₹{editId === sale._id ? editData.paymentDue : sale.paymentDue}</td>
                    <td>{editId === sale._id ? <input value={editData.billDueDate} onChange={(e) => setEditData({...editData, billDueDate: e.target.value})} /> : sale.billDueDate}</td>

                    <td>{editId === sale._id ? <input value={editData.remarks} onChange={(e) => setEditData({...editData, remarks: e.target.value})} /> : sale.remarks}</td>
                    
                    <td>
                      {editId === sale._id ? (
                        <div className="btn-group-row">
                            <button className="save-btn-ui" onClick={handleSave}>💾</button> 
                            <button className="cancel-btn-ui" onClick={() => setEditId(null)}>✖</button>
                        </div>
                      ) : (
                        <div className="btn-group-row">
                            <button className="row-edit-btn" onClick={() => startEdit(sale)} disabled={!isAuthorized}>✏️</button> 
                            <button className="row-delete-btn" onClick={() => handleDelete(sale._id)} disabled={!isAuthorized}>🗑️</button>
                        </div>
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

      <CustomSnackbar 
        open={snackbar.open} 
        message={snackbar.message} 
        severity={snackbar.severity} 
        onClose={() => setSnackbar({ ...snackbar, open: false })} 
      />
    </>
  );
};

export default SalesTable;