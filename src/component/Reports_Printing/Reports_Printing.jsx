import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue } from "firebase/database";
import { app } from "../../redux/api/firebase/firebase";
import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";
import './Reports_Printing.css';

const Reports_Printing = () => {
    const db = getDatabase(app);
    const [loading, setLoading] = useState(false);
    const [category, setCategory] = useState("sales"); 
    const [subList, setSubList] = useState([]); 
    const [selectedSubItem, setSelectedSubItem] = useState("All"); 
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [rawData, setRawData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

    const showMsg = (msg, type = "info") => {
        setSnackbar({ open: true, message: msg, severity: type });
    };

    useEffect(() => {
        setLoading(true);
        const dataRef = ref(db, category);
        onValue(dataRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
                setRawData(list);
                setFilteredData(list);

                let uniqueNames = [];
                if (category === "sales") uniqueNames = [...new Set(list.map(item => item.customerName))];
                else if (category === "purchases") uniqueNames = [...new Set(list.map(item => item.supplierName || item.itemName))];
                else if (category === "employees") uniqueNames = [...new Set(list.map(item => item.name))];
                setSubList(uniqueNames.filter(Boolean));
            } else {
                setRawData([]); setFilteredData([]); setSubList([]);
            }
            setSelectedSubItem("All");
            setTimeout(() => setLoading(false), 500);
        });
    }, [category, db]);

    const handleFilter = () => {
        let temp = [...rawData];
        if (startDate && endDate) temp = temp.filter(item => item.date >= startDate && item.date <= endDate);
        if (selectedSubItem !== "All") {
            temp = temp.filter(item => (item.customerName === selectedSubItem) || (item.supplierName === selectedSubItem) || (item.name === selectedSubItem));
        }
        setFilteredData(temp);
        showMsg(`${temp.length} Records found!`, "success");
    };

    // Total calculation logic
    const calculateTotal = () => {
        return filteredData.reduce((sum, item) => sum + (Number(item.totalPrice) || Number(item.totalAmount) || Number(item.amount) || Number(item.salary) || 0), 0);
    };

    return (
        <div className="reports-full-screen">
            {loading && <Loader />}
            
            <div className="report-controls no-print">
                <h2 className="table-title">🖨️ Report & Billing Center</h2>
                <div className="report-form-grid">
                    <div className="input-group">
                        <label>Report Category</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)}>
                            <option value="sales">Sales (Grahak)</option>
                            <option value="purchases">Purchases (Stock)</option>
                            <option value="employees">Employees (Salary)</option>
                        </select>
                    </div>
                    <div className="input-group">
                        <label>Filter By {category === 'sales' ? 'Buyer' : 'Person'}</label>
                        <select value={selectedSubItem} onChange={(e) => setSelectedSubItem(e.target.value)}>
                            <option value="All">-- All Records --</option>
                            {subList.map((name, i) => <option key={i} value={name}>{name}</option>)}
                        </select>
                    </div>
                    <div className="input-group">
                        <label>From Date</label>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                    <div className="input-group">
                        <label>To Date</label>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                </div>
                <div className="report-actions">
                    <button className="btn-filter" onClick={handleFilter}>🔍 View Data</button>
                    <button className="btn-print-main" onClick={() => window.print()}>🖨️ Print A4 Invoice</button>
                </div>
            </div>

            <div className="printable-invoice A4">
                <div className="invoice-header only-print">
                    <div className="company-info">
                        <h1>DHARA SHAKTI INDUSTRIES</h1>
                        <p>Address: Industrial Area, Near Main Gate, City</p>
                        <p>Contact: +91 99999-XXXXX | Email: dharashakti@gmail.com</p>
                    </div>
                    <div className="report-meta">
                        <h2>{category.toUpperCase()} REPORT</h2>
                        <p><strong>Entity:</strong> {selectedSubItem}</p>
                        <p><strong>Period:</strong> {startDate || 'Start'} to {endDate || 'End'}</p>
                    </div>
                </div>

                <table className="modern-report-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            {category === "sales" && <><th>Customer</th><th>Bill No</th><th>Product</th><th>Amount</th></>}
                            {category === "purchases" && <><th>Item</th><th>Supplier</th><th>Qty</th><th>Amount</th></>}
                            {category === "employees" && <><th>Name</th><th>Role</th><th>Salary Slip</th></>}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((item) => (
                            <tr key={item.id}>
                                <td>{item.date || item.joiningDate}</td>
                                {category === "sales" && <><td>{item.customerName}</td><td>{item.billNo}</td><td>{item.productName}</td><td>₹{item.totalPrice}</td></>}
                                {category === "purchases" && <><td>{item.itemName || item.item}</td><td>{item.supplierName || "Direct"}</td><td>{item.quantity}</td><td>₹{item.totalAmount || item.amount}</td></>}
                                {category === "employees" && <><td>{item.name}</td><td>{item.designation}</td><td>₹{item.salary}</td></>}
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                      <tr className="grand-total-row">
    <td colSpan={category === "employees" ? 2 : 4} style={{ textAlign: 'right' }}>
        <strong>GRAND TOTAL:</strong>
    </td>
    <td style={{ color: '#000', fontWeight: 'bold' }}>
        ₹{calculateTotal()}
    </td>
</tr>
                    </tfoot>
                </table>

                <div className="invoice-footer only-print">
                    <div className="signature-box">
                        <p>___________________</p>
                        <p>Authorized Signatory</p>
                    </div>
                    <div className="signature-box">
                        <p>___________________</p>
                        <p>Receiver Signature</p>
                    </div>
                </div>
            </div>

            <CustomSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} />
        </div>
    );
};

export default Reports_Printing;