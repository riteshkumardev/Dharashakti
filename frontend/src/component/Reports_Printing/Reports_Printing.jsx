import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './Reports_Printing.css';
import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

const Reports_Printing = () => {
    const [loading, setLoading] = useState(false);
    const [category, setCategory] = useState("sales"); 
    const [productFilter, setProductFilter] = useState("All");
    const [selectedPerson, setSelectedPerson] = useState("All"); 
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [rawData, setRawData] = useState([]);
    const [filteredData, setFilteredData] = useState([]); 
    const [personList, setPersonList] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
    const productCategories = ["Corn", "Corn Grit", "Corn Flour", "Cattle Feed", "Rice Grit", "Rice Flour", "Packing Bag", "Rice Broken"];

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const endpoint = category === "stock" ? "stocks" : category;
            const res = await axios.get(`${API_URL}/api/${endpoint}`);
            if (res.data.success) {
                const list = res.data.data;
                setRawData(list);
                setFilteredData([]); 
                generatePersonList(list, category);
            }
        } catch (err) {
            setSnackbar({ open: true, message: "Error fetching data!", severity: "error" });
        } finally {
            setTimeout(() => setLoading(false), 500);
        }
    }, [category, API_URL]);

    useEffect(() => {
        fetchData();
        setProductFilter("All");
        setSelectedPerson("All");
    }, [fetchData]);

    const generatePersonList = (data, cat) => {
        if (cat === "stock") {
            setPersonList([]);
            return;
        }
        let names = [];
        if (cat === "sales") names = [...new Set(data.map(item => item.customerName))];
        else if (cat === "purchases") names = [...new Set(data.map(item => item.supplierName))];
        setPersonList(names.filter(Boolean).sort());
    };

    const handleFilter = () => {
        let temp = [...rawData];

        // Date Filter (Not usually applied to aggregate Stock, but kept for Sales/Purchase)
        if (startDate && endDate && category !== "stock") {
            temp = temp.filter(item => item.date >= startDate && item.date <= endDate);
        }

        // Party Filter (Only for Sales/Purchase)
        if (selectedPerson !== "All" && category !== "stock") {
            temp = temp.filter(item => (item.customerName === selectedPerson) || (item.supplierName === selectedPerson));
        }

        // Product Filter (Works for all)
        if (productFilter !== "All") {
            temp = temp.filter(item => {
                const pName = item.productName || "";
                const inGoods = item.goods && item.goods.some(g => g.product.toLowerCase().includes(productFilter.toLowerCase()));
                return pName.toLowerCase().includes(productFilter.toLowerCase()) || inGoods;
            });
        }

        setFilteredData(temp);
        setSnackbar({ open: true, message: `${temp.length} Records Found!`, severity: "success" });
    };

    const calculateTotalQty = () => {
        return filteredData.reduce((total, item) => {
            if (category === "sales") {
                return total + (item.goods ? item.goods.reduce((sum, g) => sum + (Number(g.quantity) || 0), 0) : 0);
            } else if (category === "purchases") {
                return total + (Number(item.quantity) || 0);
            } else {
                // Stock Logic
                return total + (Number(item.totalQuantity) || 0);
            }
        }, 0);
    };

    const calculateGrandTotalVal = () => {
        if (category === "stock") return 0; // Inventory doesn't usually have a "Taxable Amount" in this JSON
        return filteredData.reduce((total, item) => {
            if (category === "sales") {
                return total + (item.goods ? item.goods.reduce((sum, g) => sum + (Number(g.taxableAmount) || 0), 0) : 0);
            } else {
                return total + (Number(item.totalAmount) || 0);
            }
        }, 0);
    };

    return (
        <div className="reports-full-screen">
            {loading && <Loader />}
            
            <div className="report-controls no-print">
                <div className="report-header-flex">
                    <h2 className="table-title">🖨️ Report Center</h2>
                </div>
                <div className="report-form-grid">
                    <div className="input-group">
                        <label>Category</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)}>
                            <option value="sales">Sales (Billings)</option>
                            <option value="purchases">Purchases (Inward)</option>
                            <option value="stock">Current Inventory</option>
                        </select>
                    </div>
                    <div className="input-group">
                        <label>Product Filter</label>
                        <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)}>
                            <option value="All">All Items</option>
                            {productCategories.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    {category !== "stock" && (
                        <>
                            <div className="input-group">
                                <label>Party Name</label>
                                <select value={selectedPerson} onChange={(e) => setSelectedPerson(e.target.value)}>
                                    <option value="All">-- All Parties --</option>
                                    {personList.map((name, i) => <option key={i} value={name}>{name}</option>)}
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Date Range</label>
                                <div className="date-flex">
                                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                                </div>
                            </div>
                        </>
                    )}
                </div>
                <div className="report-actions">
                    <button className="btn-filter" onClick={handleFilter}>🔍 Generate</button>
                    <button className="btn-print-main" onClick={() => window.print()} disabled={filteredData.length === 0}>🖨️ Print PDF</button>
                </div>
            </div>

            <div className="printable-report-wrapper">
                <div className="print-header-top">
                    <h1>DHARA SHAKTI AGRO PRODUCTS</h1>
                    <div className="header-meta-row">
                        <span><strong>GSTIN:</strong> 10DZTPM1457E1ZE</span>
                        <span><strong>Report:</strong> {category.toUpperCase()} Ledger</span>
                        <span><strong>Generated:</strong> {new Date().toLocaleDateString()}</span>
                    </div>
                </div>

                <table className="print-main-table">
                    <thead>
                        {category === "stock" ? (
                            <tr>
                                <th>Product Name</th>
                                <th>Last Updated</th>
                                <th className="text-right">Available Stock (Qty)</th>
                            </tr>
                        ) : (
                            <tr>
                                <th className="col-date">Date</th>
                                <th className="col-bill">Bill No</th>
                                <th>Party Name</th>
                                <th>Product Detail</th>
                                <th className="col-qty">Qty</th>
                                <th className="text-right col-amt">Taxable Amt</th>
                            </tr>
                        )}
                    </thead>
                    <tbody>
                        {filteredData.map((item, idx) => (
                            <React.Fragment key={item._id || idx}>
                                {category === "sales" && item.goods && item.goods.map((g, gIdx) => (
                                    <tr key={`${item._id}-${gIdx}`}>
                                        <td className="nowrap-cell">{gIdx === 0 ? item.date : ""}</td>
                                        <td>{gIdx === 0 ? item.billNo : ""}</td>
                                        <td>{gIdx === 0 ? item.customerName : ""}</td>
                                        <td className="bold-text">{g.product}</td>
                                        <td>{g.quantity}</td>
                                        <td className="text-right">₹{Number(g.taxableAmount || 0).toLocaleString()}</td>
                                    </tr>
                                ))}
                                {category === "purchases" && (
                                    <tr>
                                        <td className="nowrap-cell">{item.date}</td>
                                        <td>{item.billNo || "-"}</td>
                                        <td>{item.supplierName}</td>
                                        <td className="bold-text">{item.productName}</td>
                                        <td>{item.quantity}</td>
                                        <td className="text-right">₹{Number(item.totalAmount || 0).toLocaleString()}</td>
                                    </tr>
                                )}
                                {category === "stock" && (
                                    <tr>
                                        <td className="bold-text">{item.productName}</td>
                                        <td>{new Date(item.updatedAt).toLocaleDateString()}</td>
                                        <td className={`text-right ${item.totalQuantity < 0 ? 'red-text' : ''}`}>
                                            {Number(item.totalQuantity).toLocaleString()} kg
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                    <tfoot className="report-summary-footer">
                        {category === "stock" ? (
                            <tr>
                                <td colSpan="2" className="text-right">TOTAL INVENTORY QTY:</td>
                                <td className="text-right">{calculateTotalQty().toLocaleString()} kg</td>
                            </tr>
                        ) : (
                            <tr>
                                <td colSpan="4" className="text-right">GRAND TOTAL:</td>
                                <td>{calculateTotalQty().toLocaleString()}</td>
                                <td className="text-right">₹{calculateGrandTotalVal().toLocaleString()}</td>
                            </tr>
                        )}
                    </tfoot>
                </table>

                <div className="signature-section">
                    <div className="sig-box"><div className="sig-line"></div><p>Prepared By</p></div>
                    <div className="sig-box"><div className="sig-line"></div><p>Authorized Signatory</p></div>
                </div>
            </div>

            <CustomSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} />
        </div>
    );
};

export default Reports_Printing;