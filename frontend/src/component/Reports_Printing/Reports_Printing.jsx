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
    const productCategories = ["Corn Grit", "Corn Flour", "Cattle Feed", "Rice Grit", "Rice Flour", "Packing Bag"];

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const endpoint = category === "stock" ? "stocks" : category;
            const res = await axios.get(`${API_URL}/api/${endpoint}`);
            if (res.data.success) {
                const list = res.data.data;
                setRawData(list);
                setFilteredData([]); 
                if (category !== "stock") generatePersonList(list, "All");
                else setPersonList([]);
            }
        } catch (err) {
            setSnackbar({ open: true, message: "Error fetching live data!", severity: "error" });
        } finally {
            setTimeout(() => setLoading(false), 500);
        }
    }, [category, API_URL]);

    useEffect(() => {
        fetchData();
        setProductFilter("All");
        setSelectedPerson("All");
    }, [fetchData]);

    const generatePersonList = (data, pFilter) => {
        let names = [];
        if (category === "sales") names = [...new Set(data.map(item => item.customerName))];
        else if (category === "purchases") names = [...new Set(data.map(item => item.supplierName))];
        setPersonList(names.filter(Boolean).sort());
    };

    const handleProductChange = (val) => {
        setProductFilter(val);
        setSelectedPerson("All");
    };

    const handleFilter = () => {
        let temp = [...rawData];

        if (startDate && endDate) {
            temp = temp.filter(item => item.date >= startDate && item.date <= endDate);
        }

        if (selectedPerson !== "All") {
            temp = temp.filter(item => (item.customerName === selectedPerson) || (item.supplierName === selectedPerson));
        }

        // Logic to filter based on products inside the 'goods' array
        if (productFilter !== "All") {
            temp = temp.filter(item => 
                item.goods && item.goods.some(g => g.product.toLowerCase().includes(productFilter.toLowerCase()))
            );
        }

        setFilteredData(temp);
        setSnackbar({ open: true, message: `${temp.length} Main Records Found!`, severity: "success" });
    };

    const calculateGrandTotal = () => {
        return filteredData.reduce((total, item) => {
            const goodsTotal = item.goods ? item.goods.reduce((sum, g) => sum + (Number(g.taxableAmount) || 0), 0) : 0;
            return total + goodsTotal;
        }, 0);
    };

    return (
        <div className="reports-full-screen">
            {loading && <Loader />}
            
            <div className="report-controls no-print">
                <div className="report-header-flex">
                    <h2 className="table-title">🖨️ Professional Report Center</h2>
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
                        <label>Product Category Filter</label>
                        <select value={productFilter} onChange={(e) => handleProductChange(e.target.value)}>
                            <option value="All">All Categories</option>
                            {productCategories.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    {category !== "stock" && (
                        <div className="input-group">
                            <label>Party Name</label>
                            <select value={selectedPerson} onChange={(e) => setSelectedPerson(e.target.value)}>
                                <option value="All">-- All Parties --</option>
                                {personList.map((name, i) => <option key={i} value={name}>{name}</option>)}
                            </select>
                        </div>
                    )}
                    <div className="input-group">
                        <label>Date Range</label>
                        <div className="date-flex">
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                    </div>
                </div>
                <div className="report-actions">
                    <button className="btn-filter" onClick={handleFilter}>🔍 Generate</button>
                    <button className="btn-print-main" onClick={() => window.print()} disabled={filteredData.length === 0}>🖨️ Print PDF</button>
                </div>
            </div>

            <div className="printable-report-wrapper">
                <div className="print-header-top">
                    <h1>DHARA SHAKTI AGRO PRODUCTS</h1>
                    <p>Quality Manufacturers of Corn Grits & Animal Feed</p>
                    <p><strong>GSTIN:</strong> 10DZTPM1457E1ZE | <strong>Report:</strong> {category.toUpperCase()} Ledger</p>
                    <p>Period: {startDate || "N/A"} to {endDate || "N/A"}</p>
                </div>

                <table className="print-main-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Bill No</th>
                            <th>Party Name</th>
                            <th>Product Detail</th>
                            <th>Qty</th>
                            <th className="text-right">Taxable Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((item) => (
                            // Use Fragment to allow multiple <tr> per item
                            <React.Fragment key={item._id}>
                                {item.goods && item.goods.map((g, idx) => (
                                    <tr key={`${item._id}-${idx}`}>
                                        {/* Show primary info only on the first row of a bill for clarity */}
                                        <td>{idx === 0 ? item.date : ""}</td>
                                        <td>{idx === 0 ? item.billNo : ""}</td>
                                        <td>{idx === 0 ? (item.customerName || item.supplierName) : ""}</td>
                                        
                                        {/* Data coming from the 'goods' array */}
                                        <td className="bold-text">{g.product}</td>
                                        <td>{g.quantity}</td>
                                        <td className="text-right">₹{Number(g.taxableAmount || 0).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                    <tfoot className="report-summary-footer">
                        <tr>
                            <td colSpan="5" className="text-right">GRAND TOTAL (TAXABLE):</td>
                            <td className="text-right">₹{calculateGrandTotal().toLocaleString()}</td>
                        </tr>
                    </tfoot>
                </table>

                <div className="signature-section">
                    <div className="sig-box">
                        <div className="sig-line"></div>
                        <p>Prepared By</p>
                    </div>
                    <div className="sig-box">
                        <div className="sig-line"></div>
                        <p>Authorized Signatory</p>
                    </div>
                </div>
                <p className="timestamp-footer">Report Generated | {new Date().toLocaleString()}</p>
            </div>

            <CustomSnackbar 
                open={snackbar.open} 
                message={snackbar.message} 
                severity={snackbar.severity} 
                onClose={() => setSnackbar({ ...snackbar, open: false })} 
            />
        </div>
    );
};

export default Reports_Printing;