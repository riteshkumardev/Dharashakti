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

    const calculateTotal = () => {
        return filteredData.reduce((sum, item) => sum + (Number(item.totalPrice) || Number(item.totalAmount) || Number(item.amount) || Number(item.salary) || 0), 0);
    };

    return (
        <div className="reports-full-screen">
            {loading && <Loader />}
            
            <div className="report-controls no-print">
                <h2 className="table-title">🖨️ Bill of Supply Center</h2>
                <div className="report-form-grid">
                    <div className="input-group">
                        <label>Category</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)}>
                            <option value="sales">Sales</option>
                            <option value="purchases">Purchases</option>
                            <option value="employees">Employees</option>
                        </select>
                    </div>
                    <div className="input-group">
                        <label>Filter By Name</label>
                        <select value={selectedSubItem} onChange={(e) => setSelectedSubItem(e.target.value)}>
                            <option value="All">-- All --</option>
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
                    <button className="btn-print-main" onClick={() => window.print()}>🖨️ Print Bill of Supply</button>
                </div>
            </div>

            <div className="printable-invoice A4">
                <div className="invoice-header only-print">
                    <div className="bill-tag">BILL OF SUPPLY</div>
                    <div className="company-info-center">
                        <h1>DHARA SHAKTI AGRO PRODUCTS</h1>
                        <p className="manufacture-line">MANUFACTURER OF CORN GRITS & FLOUR, RICE GRITS & FLOUR, ANIMAL FEED</p>
                        <p>Sri Pur Gahar, Khanpur, Samastipur, Bihar-848117</p>
                        <p>Mob.: 7325055939, 8789895589, 8102720905</p>
                        <p>FSSAI : 2042331000141 | GSTIN : 10DZTPM1457E1ZE</p>
                    </div>
                </div>

                <div className="party-details-grid only-print">
                    <div className="party-box">
                        <p><strong>PARTY DETAILS:</strong> {selectedSubItem !== "All" ? selectedSubItem : "____________________"}</p>
                        <p><strong>GSTIN / UIN:</strong> 10ABECS2390B1ZY</p>
                    </div>
                    <div className="invoice-meta-box">
                        <p><strong>Invoice No:</strong> {filteredData[0]?.billNo || '____'}</p>
                        <p><strong>Dated:</strong> {startDate || '__________'}</p>
                        <p><strong>Place of Supply:</strong> Bihar</p>
                    </div>
                </div>

                <table className="modern-report-table">
                    <thead>
                        <tr>
                            <th>Sl. No.</th>
                            <th>Description of Goods</th>
                            <th>HSN / SAC</th>
                            <th>Qty</th>
                            <th>Rate</th>
                            <th>Amount (Rs.)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((item, index) => (
                            <tr key={item.id}>
                                <td>{index + 1}</td>
                                <td>{item.productName || item.itemName} (NON BRANDED)</td>
                                <td>11031300</td>
                                <td>{item.quantity || "____"}</td>
                                <td>{item.rate || "____"}</td>
                                <td>{item.totalPrice || item.totalAmount || "____"}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="exempt-row">
                            <td colSpan="5">TAX EXEMPTED GOODS</td>
                            <td>₹{calculateTotal()}</td>
                        </tr>
                        <tr className="grand-total-row">
                            <td colSpan="5" style={{textAlign: 'right'}}>GRAND TOTAL</td>
                            <td>₹{calculateTotal()}</td>
                        </tr>
                    </tfoot>
                </table>

                <div className="invoice-footer-pro only-print">
                    <div className="bank-info-section">
                        <p><strong>Bank Details:</strong> MS DHARA SHAKTI AGRO PRODUCTS | ACCOUNT NUMBER: 3504008700005079</p>
                        <p>IFSC: PUNB0350400 | BRANCH NAME: WARISNAGAR</p>
                    </div>
                    <div className="terms-section">
                        <p>We do not take responsibility for loss of invoice after unloading of material. Interest at 24% per annum will be charged if payment not made within due date.</p>
                    </div>
                    <div className="signature-grid">
                        <div className="sign-box">
                            <p>Receiver's Signature</p>
                        </div>
                        <div className="signboauthsign" >
                            <p>For DHARA SHAKTI AGRO PRODUCTS</p>
                          
                            <p>Auth. Signatory</p>
                        </div>
                    </div>
                </div>
            </div>

            <CustomSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} />
        </div>
    );
};

export default Reports_Printing;