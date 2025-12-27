import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue } from "firebase/database";
import { app } from "../../redux/api/firebase/firebase";
import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";
import './Reports_Printing.css';

const Reports_Printing = () => {
    const db = getDatabase(app);
    const [loading, setLoading] = useState(false);
    
    // Step 1: Category
    const [category, setCategory] = useState("sales"); 
    // Step 2: Product
    const [productFilter, setProductFilter] = useState("All");
    // Step 3: Person
    const [selectedPerson, setSelectedPerson] = useState("All"); 

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [rawData, setRawData] = useState([]);
    const [filteredData, setFilteredData] = useState([]); // Default khali rahega
    const [personList, setPersonList] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

    const productCategories = ["Corn Grit", "Corn Flour", "Cattle Feed", "Rice Grit", "Rice Flour", "Packing Bag"];

    // 1️⃣ Data Fetching & Initial Reset
    useEffect(() => {
        setLoading(true);
        const dataRef = ref(db, category);
        onValue(dataRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
                setRawData(list);
                // Table ko khali rakhne ke liye filteredData ko update nahi karenge
                setFilteredData([]); 
                updatePersonList(list, "All");
            } else {
                setRawData([]); setFilteredData([]); setPersonList([]);
            }
            setProductFilter("All");
            setSelectedPerson("All");
            setTimeout(() => setLoading(false), 500);
        });
    }, [category, db]);

    // 2️⃣ Dynamic Person List Update
    const updatePersonList = (data, pFilter) => {
        let list = data;
        if (pFilter !== "All") {
            list = data.filter(item => item.productName === pFilter || item.item === pFilter);
        }
        
        let names = [];
        if (category === "sales") names = [...new Set(list.map(item => item.customerName))];
        else if (category === "purchases") names = [...new Set(list.map(item => item.supplierName || item.itemName))];
        else if (category === "employees") names = [...new Set(list.map(item => item.name))];
        
        setPersonList(names.filter(Boolean));
    };

    const handleProductChange = (val) => {
        setProductFilter(val);
        setSelectedPerson("All");
        updatePersonList(rawData, val);
    };

    // 3️⃣ Final Filter Logic (Strictly for Selected Data)
    const handleFilter = () => {
        if (selectedPerson === "All" && productFilter === "All" && !startDate) {
            setSnackbar({ open: true, message: "Please select a specific filter first!", severity: "warning" });
            return;
        }

        let temp = [...rawData];

        // Date Range Filter
        if (startDate && endDate) {
            temp = temp.filter(item => item.date >= startDate && item.date <= endDate);
        }

        // Category Wise Person Filter
        if (category === "employees") {
            if (selectedPerson !== "All") {
                temp = temp.filter(item => item.name === selectedPerson); // Sirf Murari ka data 
            }
        } else {
            if (productFilter !== "All") {
                temp = temp.filter(item => item.productName === productFilter || item.item === productFilter);
            }
            if (selectedPerson !== "All") {
                temp = temp.filter(item => 
                    (item.customerName === selectedPerson) || 
                    (item.supplierName === selectedPerson)
                );
            }
        }

        setFilteredData(temp);
        setSnackbar({ open: true, message: `${temp.length} Records Loaded!`, severity: "success" });
    };

    const calculateTotal = () => {
        return filteredData.reduce((sum, item) => sum + (Number(item.totalPrice) || Number(item.totalAmount) || Number(item.salary) || 0), 0);
    };

    return (
        <div className="reports-full-screen">
            {loading && <Loader />}
            
            <div className="report-controls no-print">
                <h2 className="table-title">🖨️ Bill of Supply Center</h2>
                <div className="report-form-grid">
                    <div className="input-group">
                        <label>1. Category</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)}>
                            <option value="sales">Sales</option>
                            <option value="purchases">Purchases</option>
                            <option value="employees">Employees</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label>2. Product/Item</label>
                        <select value={productFilter} onChange={(e) => handleProductChange(e.target.value)}>
                            <option value="All">All Products</option>
                            {productCategories.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>

                    <div className="input-group">
                        <label>3. Select Person</label>
                        <select value={selectedPerson} onChange={(e) => setSelectedPerson(e.target.value)}>
                            <option value="All">-- Select Name --</option>
                            {personList.map((name, i) => <option key={i} value={name}>{name}</option>)}
                        </select>
                    </div>

                    <div className="input-group">
                        <label>4. Date Range</label>
                        <div style={{display: 'flex', gap: '5px'}}>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                    </div>
                </div>

                <div className="report-actions">
                    <button className="btn-filter" onClick={handleFilter}>🔍 Show Data</button>
                    <button className="btn-print-main" onClick={() => window.print()}>🖨️ Print Bill</button>
                </div>
            </div>

            <div className="printable-invoice A4">
                {/* Header Information [cite: 1] */}
                <div className="invoice-header only-print">
                    <div className="company-info-center">
                        <h1>DHARA SHAKTI AGRO PRODUCTS</h1>
                        <p className="manufacture-line">MANUFACTURER OF CORN GRITS, RICE GRITS & ANIMAL FEED</p>
                        <p>GSTIN : 10DZTPM1457E1ZE | GSTIN (Buyer): 10ABECS2390B1ZY</p>
                    </div>
                </div>

                <table className="modern-report-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Name/Party</th>
                            <th>Description</th>
                            <th>Qty</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.length > 0 ? (
                            filteredData.map((item) => (
                                <tr key={item.id}>
                                    {/* Fallback to joiningDate if transaction date missing */}
                                    <td>{item.date || item.joiningDate || "N/A"}</td>
                                    <td>{item.customerName || item.supplierName || item.name}</td>
                                    <td>{item.productName || item.itemName || "SERVICE"}</td>
                                    <td>{item.quantity || "1"}</td>
                                    <td>₹{item.totalPrice || item.totalAmount || item.salary}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" style={{textAlign: 'center', padding: '20px', color: '#999'}}>
                                    No Data Selected. Use filters above and click "Show Data".
                                </td>
                            </tr>
                        )}
                    </tbody>
                    {filteredData.length > 0 && (
                        <tfoot>
                            <tr className="grand-total-row">
                                <td colSpan="4" style={{textAlign: 'right'}}><strong>GRAND TOTAL:</strong></td>
                                <td><strong>₹{calculateTotal()}</strong></td>
                            </tr>
                        </tfoot>
                    )}
                </table>

                <div className="invoice-footer-pro only-print">
                    <div className="signature-grid">
                        <div className="sign-box"><p>Authorized Signatory</p></div> 
                        <div className="sign-box"><p>Receiver Signature</p></div>
                    </div>
                </div>
            </div>

            <CustomSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} />
        </div>
    );
};

export default Reports_Printing;