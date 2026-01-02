import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './Reports_Printing.css';
import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

const Reports_Printing = () => {
    const [loading, setLoading] = useState(false);
    
    // Filters State
    const [category, setCategory] = useState("sales"); 
    const [productFilter, setProductFilter] = useState("All");
    const [selectedPerson, setSelectedPerson] = useState("All"); 
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [rawData, setRawData] = useState([]);
    const [filteredData, setFilteredData] = useState([]); 
    const [personList, setPersonList] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

    const productCategories = ["Corn Grit", "Corn Flour", "Cattle Feed", "Rice Grit", "Rice Flour", "Packing Bag"];

    // 1️⃣ Fetch Data from MongoDB (Optimized with useCallback)
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Humare backend routes: /api/sales, /api/stocks, /api/purchases
            const endpoint = category === "stock" ? "stocks" : category;
            const res = await axios.get(`http://localhost:5000/api/${endpoint}`);
            
            if (res.data.success) {
                const list = res.data.data;
                setRawData(list);
                setFilteredData([]); // Reset view on category change
                
                if (category !== "stock") {
                    generatePersonList(list, "All");
                } else {
                    setPersonList([]);
                }
            }
        } catch (err) {
            setSnackbar({ open: true, message: "Server error while fetching data!", severity: "error" });
        } finally {
            setTimeout(() => setLoading(false), 500);
        }
    }, [category]);

    useEffect(() => {
        fetchData();
        setProductFilter("All");
        setSelectedPerson("All");
    }, [fetchData]);

    // 2️⃣ Generate Party List dynamically
    const generatePersonList = (data, pFilter) => {
        let list = data;
        if (pFilter !== "All") {
            list = data.filter(item => item.productName === pFilter);
        }
        
        let names = [];
        if (category === "sales") names = [...new Set(list.map(item => item.customerName))];
        else if (category === "purchases") names = [...new Set(list.map(item => item.supplierName))];
        
        setPersonList(names.filter(Boolean).sort());
    };

    const handleProductChange = (val) => {
        setProductFilter(val);
        setSelectedPerson("All");
        generatePersonList(rawData, val);
    };

    // 3️⃣ Auto-Filter Logic (No Manual Refresh Required)
    const handleFilter = () => {
        let temp = [...rawData];

        // Date Range Filter
        if (startDate && endDate) {
            temp = temp.filter(item => {
                const itemDate = item.date; // Format YYYY-MM-DD
                return itemDate >= startDate && itemDate <= endDate;
            });
        }

        // Product Filter
        if (productFilter !== "All") {
            temp = temp.filter(item => item.productName === productFilter);
        }
        
        // Person/Party Filter
        if (category !== "stock" && selectedPerson !== "All") {
            temp = temp.filter(item => 
                (item.customerName === selectedPerson) || (item.supplierName === selectedPerson)
            );
        }

        setFilteredData(temp);
        setSnackbar({ open: true, message: `${temp.length} Records Found!`, severity: "success" });
    };

    const calculateTotal = () => {
        return filteredData.reduce((sum, item) => sum + (Number(item.totalPrice) || Number(item.totalAmount) || 0), 0);
    };

    return (
        <div className="reports-full-screen">
            {loading && <Loader />}
            
            <div className="report-controls no-print">
                <div className="report-header-flex">
                    <h2 className="table-title">🖨️ Professional Report Center</h2>
                    <div className="live-status">System: <span className="green-dot"></span> MongoDB Live</div>
                </div>

                <div className="report-form-grid">
                    <div className="input-group">
                        <label>Report Category</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)}>
                            <option value="sales">Sales (Billings)</option>
                            <option value="purchases">Purchases (Inward)</option>
                            <option value="stock">Current Inventory</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label>Filter by Product</label>
                        <select value={productFilter} onChange={(e) => handleProductChange(e.target.value)}>
                            <option value="All">All Items</option>
                            {productCategories.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>

                    {category !== "stock" && (
                        <div className="input-group">
                            <label>Filter by Party Name</label>
                            <select value={selectedPerson} onChange={(e) => setSelectedPerson(e.target.value)}>
                                <option value="All">-- All Parties --</option>
                                {personList.map((name, i) => <option key={i} value={name}>{name}</option>)}
                            </select>
                        </div>
                    )}

                    <div className="input-group">
                        <label>Period (Start - End)</label>
                        <div className="date-flex">
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                    </div>
                </div>

                <div className="report-actions">
                    <button className="btn-filter" onClick={handleFilter}>🔍 Generate Report</button>
                    <button className="btn-print-main" onClick={() => window.print()} disabled={filteredData.length === 0}>🖨️ Print PDF</button>
                </div>
            </div>

            {/* PROFESSIONAL PRINTABLE AREA */}
            <div className="printable-invoice A4">
                <div className="invoice-header only-print">
                    <div className="company-info-center">
                        <h1 className="company-main-title">DHARA SHAKTI AGRO PRODUCTS</h1>
                        <p className="manufacture-line">Quality Manufacturers of Corn Grits & Animal Feed</p>
                        <div className="gst-report-line">
                            <span><strong>GSTIN:</strong> 10DZTPM1457E1ZE</span>
                            <span><strong>Report:</strong> {category.toUpperCase()} Ledger</span>
                        </div>
                        <p className="report-period">
                            Period: {startDate || "Starting"} to {endDate || "Present"}
                        </p>
                    </div>
                </div>

                <table className="modern-report-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Party/Description</th>
                            <th>Product Name</th>
                            <th>Qty (kg/bag)</th>
                            <th className="text-right">Total Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.length > 0 ? (
                            filteredData.map((item) => (
                                <tr key={item._id}>
                                    <td>{item.date || "---"}</td>
                                    <td>{item.customerName || item.supplierName || (category === "stock" ? "Warehouse" : "Cash Sale")}</td>
                                    <td className="bold-text">{item.productName || item.item}</td>
                                    <td>{item.quantity || item.totalQuantity || 0}</td>
                                    <td className="text-right">₹{Number(item.totalPrice || item.totalAmount || 0).toLocaleString()}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="placeholder-row">
                                    No data found. Please adjust filters and click "Generate Report".
                                </td>
                            </tr>
                        )}
                    </tbody>
                    {filteredData.length > 0 && (
                        <tfoot>
                            <tr className="grand-total-row">
                                <td colSpan="4" className="text-right"><strong>TOTAL BUSINESS VALUE:</strong></td>
                                <td className="text-right"><strong>₹{calculateTotal().toLocaleString()}</strong></td>
                            </tr>
                        </tfoot>
                    )}
                </table>

                <div className="print-footer-signature only-print">
                    <div className="signature-grid">
                        <div className="sign-placeholder">
                            <div className="line"></div>
                            <p>Prepared By</p>
                        </div>
                        <div className="sign-placeholder">
                            <div className="line"></div>
                            <p>Authorized Signatory</p>
                        </div>
                    </div>
                    <p className="system-gen">System Generated Report | {new Date().toLocaleString()}</p>
                </div>
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