import React, { useState, useEffect } from "react";
import "./Sales.css";
import axios from "axios";
import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

/* =========================
    🔒 Helper (NaN Safe)
   ========================= */
const toSafeNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

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
  const rowsPerPage = 10; // Increased for better view

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showMsg = (msg, type = "success") => {
    setSnackbar({ open: true, message: msg, severity: type });
  };

  /* =========================
      📡 Fetch Sales
     ========================= */
  const fetchSales = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/sales`);
      if (res.data.success) {
        setSalesList(res.data.data);
      }
    } catch {
      showMsg("Server se data nahi mil raha.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [API_URL]);

  /* =========================
      🧮 Auto Calculation (Multi-Goods Friendly)
     ========================= */
  useEffect(() => {
    if (!editId || !editData.goods) return;

    // 1. Calculate Sum of all items in goods array
    const totalTaxable = editData.goods.reduce((sum, item) => {
        return sum + (toSafeNumber(item.quantity) * toSafeNumber(item.rate));
    }, 0);

    const freight = toSafeNumber(editData.freight);
    const cdPercent = toSafeNumber(editData.cashDiscount);
    const received = toSafeNumber(editData.amountReceived);

    const discount = (totalTaxable * cdPercent) / 100;
    const finalTotal = totalTaxable - freight - discount;
    const due = finalTotal - received;

    // Prevent infinite loop by checking if values actually changed
    if (editData.totalAmount !== finalTotal || editData.paymentDue !== due) {
        setEditData((prev) => ({
            ...prev,
            taxableValue: totalTaxable,
            totalAmount: finalTotal,
            paymentDue: due,
        }));
    }
  }, [
    editId,
    editData.goods,
    editData.freight,
    editData.cashDiscount,
    editData.amountReceived,
  ]);

  /* =========================
      📝 Handle Goods Array Changes
     ========================= */
  const handleGoodsChange = (index, field, value) => {
    const updatedGoods = [...editData.goods];
    updatedGoods[index] = { ...updatedGoods[index], [field]: value };
    setEditData({ ...editData, goods: updatedGoods });
  };

  /* =========================
      🔍 Filter + Sort
     ========================= */
  const getProcessedList = () => {
    let list = salesList.filter((s) => {
      const billStr = String(s.billNo || "");
      const customerStr = String(s.customerName || "");
      const vehicleStr = String(s.vehicleNo || "");

      const matchesSearch =
        customerStr.toLowerCase().includes(search.toLowerCase()) ||
        billStr.toLowerCase().includes(search.toLowerCase()) ||
        vehicleStr.toLowerCase().includes(search.toLowerCase());

      const matchesProduct =
        selectedProduct === "All" || (s.goods && s.goods.some(g => g.product === selectedProduct));

      return matchesSearch && matchesProduct;
    });

    list.sort((a, b) => {
      if (sortBy === "dateNewest") return new Date(b.date) - new Date(a.date);
      if (sortBy === "dateOldest") return new Date(a.date) - new Date(b.date);
      if (sortBy === "billAsc")
        return String(a.billNo).localeCompare(String(b.billNo), undefined, { numeric: true });
      if (sortBy === "billDesc")
        return String(b.billNo).localeCompare(String(a.billNo), undefined, { numeric: true });
      return 0;
    });

    return list;
  };

  const processedList = getProcessedList();
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = processedList.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(processedList.length / rowsPerPage);

  /* =========================
      🗑️ Delete
     ========================= */
  const handleDelete = async (id) => {
    if (!isAuthorized) {
      showMsg("Permission required.", "error");
      return;
    }
    if (!window.confirm("Kya aap sach me delete karna chahte hain?")) return;

    try {
      setLoading(true);
      const res = await axios.delete(`${API_URL}/api/sales/${id}`);
      if (res.data.success) {
        showMsg("Record Deleted Successfully!");
        fetchSales();
      }
    } catch {
      showMsg("Delete fail ho gaya.", "error");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
      💾 Save (UPDATE) 
     ========================= */
  const handleSave = async () => {
    try {
      setLoading(true);

      // We send the whole editData which contains updated goods array and totals
      const payload = {
        ...editData,
        goods: editData.goods.map(g => ({
            ...g,
            quantity: toSafeNumber(g.quantity),
            rate: toSafeNumber(g.rate),
            taxableAmount: toSafeNumber(g.quantity) * toSafeNumber(g.rate)
        }))
      };

      const res = await axios.put(`${API_URL}/api/sales/${editId}`, payload);

      if (res.data.success) {
        showMsg("Updated Successfully!");
        setEditId(null);
        fetchSales();
      }
    } catch (err) {
      showMsg(err.response?.data?.message || "Update fail ho gaya.", "error");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
      ✏️ Start Edit
     ========================= */
  const startEdit = (sale) => {
    if (!isAuthorized) {
      showMsg("Permission Required.", "warning");
      return;
    }

    setEditId(sale._id);
    setEditData({
      ...sale, // Preserve ALL hidden fields (gstin, address, etc.)
      goods: sale.goods ? [...sale.goods] : [], // Deep copy goods array
      freight: toSafeNumber(sale.freight),
      cashDiscount: toSafeNumber(sale.cashDiscount),
      amountReceived: toSafeNumber(sale.amountReceived),
      totalAmount: toSafeNumber(sale.totalAmount),
      paymentDue: toSafeNumber(sale.paymentDue),
    });
  };

  if (loading) return <Loader />;

  return (
    <>
      <div className="table-container-wide">
        <div className="table-card-wide">
          <div className="table-header-flex">
            <h2 className="table-title">SALES RECORDS</h2>
            <div className="table-controls-row">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="dateNewest">Newest Date</option>
                <option value="dateOldest">Oldest Date</option>
                <option value="billAsc">Bill No (L → H)</option>
                <option value="billDesc">Bill No (H → L)</option>
              </select>

              <select value={selectedProduct} onChange={(e) => { setSelectedProduct(e.target.value); setCurrentPage(1); }}>
                <option value="All">All Products</option>
                <option value="Corn Grit">Corn Grit</option>
                <option value="Cattle Feed">Cattle Feed</option>
                <option value="Rice Grit">Rice Grit</option>
                <option value="Corn Flour">Corn Flour</option>
              </select>

              <input
                placeholder="Search Customer/Vehicle..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>

          <div className="table-responsive-wrapper">
            <table className="modern-sales-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Bill/Vehicle</th>
                  <th>Customer</th>
                  <th>Items (Qty @ Rate)</th>
                  <th>Travel / CD%</th>
                  <th>Total</th>
                  <th>Received</th>
                  <th>Due</th>
                  <th>Remarks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.map((sale) => (
                  <tr key={sale._id}>
                    {editId === sale._id ? (
                      <>
                        <td>
                          <input type="date" className="edit-input" value={editData.date?.split('T')[0] || ""} 
                            onChange={(e) => setEditData({ ...editData, date: e.target.value })} />
                        </td>
                        <td>
                          <input className="edit-input small" value={editData.billNo} placeholder="Bill No"
                            onChange={(e) => setEditData({ ...editData, billNo: e.target.value })} /><br/>
                          <input className="edit-input small" value={editData.vehicleNo} placeholder="Vehicle"
                            onChange={(e) => setEditData({ ...editData, vehicleNo: e.target.value })} />
                        </td>
                        <td>
                          <input className="edit-input" value={editData.customerName} 
                            onChange={(e) => setEditData({ ...editData, customerName: e.target.value })} />
                        </td>
                        <td>
                          {editData.goods.map((g, idx) => (
                            <div key={idx} className="edit-item-row" style={{marginBottom: '8px', borderBottom: '1px dashed #ddd', paddingBottom: '4px'}}>
                              <span style={{fontSize: '10px', fontWeight: 'bold'}}>{g.product}</span><br/>
                              <input type="number" className="edit-input tiny" value={g.quantity} 
                                onChange={(e) => handleGoodsChange(idx, 'quantity', e.target.value)} /> @ 
                              <input type="number" className="edit-input tiny" value={g.rate} 
                                onChange={(e) => handleGoodsChange(idx, 'rate', e.target.value)} />
                            </div>
                          ))}
                        </td>
                        <td>
                          <input type="number" className="edit-input tiny" value={editData.freight} 
                            onChange={(e) => setEditData({ ...editData, freight: e.target.value })} /> / 
                          <input type="number" className="edit-input tiny" value={editData.cashDiscount} 
                            onChange={(e) => setEditData({ ...editData, cashDiscount: e.target.value })} />%
                        </td>
                        <td className="bold-cell">₹{editData.totalAmount?.toLocaleString()}</td>
                        <td>
                          <input type="number" className="edit-input small" value={editData.amountReceived} 
                            onChange={(e) => setEditData({ ...editData, amountReceived: e.target.value })} />
                        </td>
                        <td className="due-cell">₹{editData.paymentDue?.toLocaleString()}</td>
                        <td>
                          <input className="edit-input" value={editData.remarks} 
                            onChange={(e) => setEditData({ ...editData, remarks: e.target.value })} />
                        </td>
                        <td>
                          <div className="action-btns">
                            <button className="btn-save" onClick={handleSave}>✅</button>
                            <button className="btn-cancel" onClick={() => setEditId(null)}>❌</button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{sale.date ? sale.date.split('T')[0] : "---"}</td>
                        <td>{sale.billNo}<br /><small>{sale.vehicleNo || "N/A"}</small></td>
                        <td style={{fontWeight: '500'}}>{sale.customerName}</td>
                        <td>
                          {sale.goods && sale.goods.map((g, i) => (
                            <div key={i} style={{fontSize: '0.85em', borderBottom: i < sale.goods.length-1 ? '1px solid #eee' : 'none'}}>
                              {g.quantity} @ ₹{g.rate} <small style={{color: '#777'}}>({g.product})</small>
                            </div>
                          ))}
                        </td>
                        <td>₹{sale.freight} / {sale.cashDiscount}%</td>
                        <td className="bold-cell">₹{toSafeNumber(sale.totalAmount).toLocaleString()}</td>
                        <td style={{color: 'green'}}>₹{toSafeNumber(sale.amountReceived).toLocaleString()}</td>
                        <td style={{ color: "red", fontWeight: 'bold' }}>₹{toSafeNumber(sale.paymentDue).toLocaleString()}</td>
                        <td><small>{sale.remarks || "-"}</small></td>
                        <td>
                          <div className="action-btns">
                            <button className="btn-edit" onClick={() => startEdit(sale)}>✏️</button>
                            <button className="btn-delete" onClick={() => handleDelete(sale._id)}>🗑️</button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination-container">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>◀</button>
            <span>Page {currentPage} of {totalPages || 1}</span>
            <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>▶</button>
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