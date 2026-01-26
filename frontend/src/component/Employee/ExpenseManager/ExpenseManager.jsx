import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import './ExpenseManager.css';
import Loader from "../../Core_Component/Loader/Loader";
import CustomSnackbar from "../../Core_Component/Snackbar/CustomSnackbar";

const ExpenseManager = ({ role }) => {
    const isAuthorized = role === "Admin" || role === "Accountant";
    const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

    const [transactions, setTransactions] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
    
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        partyName: '',
        type: 'Payment Out',
        amount: '',
        txnId: '',
        remark: ''
    });

    const [filterParty, setFilterParty] = useState('All');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [txnRes, suppRes] = await Promise.all([
                axios.get(`${API_URL}/api/expenses`),
                axios.get(`${API_URL}/api/purchases`)
            ]);

            if (txnRes.data.success) {
                const sorted = txnRes.data.data.sort((a, b) => new Date(a.date) - new Date(b.date));
                setTransactions(sorted);
                setFilteredData(sorted);
            }
            if (suppRes.data.success) {
                const names = [...new Set(suppRes.data.data.map(s => s.supplierName))];
                setSuppliers(names.filter(Boolean).sort());
            }
        } catch (err) {
            setSnackbar({ open: true, message: "Fetch failed!", severity: "error" });
        } finally {
            setLoading(false);
        }
    }, [API_URL]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleSearch = () => {
        let temp = [...transactions];
        if (filterParty !== 'All') temp = temp.filter(t => t.partyName === filterParty);
        if (startDate && endDate) temp = temp.filter(t => t.date >= startDate && t.date <= endDate);
        setFilteredData(temp);
    };

    const resetFilters = () => {
        setFilterParty('All'); setStartDate(''); setEndDate('');
        setFilteredData(transactions);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isAuthorized) return;
        setLoading(true);
        try {
            const res = await axios.post(`${API_URL}/api/expenses`, formData);
            if (res.data.success) {
                setFormData({ ...formData, amount: '', txnId: '', remark: '' });
                setSnackbar({ open: true, message: "Saved!", severity: "success" });
                fetchData();
            }
        } catch (err) {
            setSnackbar({ open: true, message: "Error!", severity: "error" });
        } finally { setLoading(false); }
    };

    const dataWithBalance = useMemo(() => {
        let runningBal = 0;
        return filteredData.map(txn => {
            const amt = Number(txn.amount) || 0;
            txn.type === 'Payment In' ? runningBal += amt : runningBal -= amt;
            return { ...txn, currentBalance: runningBal };
        });
    }, [filteredData]);

    const totals = useMemo(() => {
        const totalIn = filteredData.filter(t => t.type === 'Payment In').reduce((s, c) => s + Number(c.amount || 0), 0);
        const totalOut = filteredData.filter(t => t.type === 'Payment Out').reduce((s, c) => s + Number(c.amount || 0), 0);
        return { totalIn, totalOut, net: totalIn - totalOut };
    }, [filteredData]);

    return (
        <div className="passbook-container">
            {loading && <Loader />}
            
            <div className="passbook-header no-print">
                <div className="title-row">
                    <h2 className="table-title">🏦 BUSINESS PASSBOOK</h2>
                    <div className="summary-cards">
                        <div className="s-card in">Total In: ₹{totals.totalIn.toLocaleString()}</div>
                        <div className="s-card out">Total Out: ₹{totals.totalOut.toLocaleString()}</div>
                        <div className={`s-card bal ${totals.net >= 0 ? 'plus' : 'minus'}`}>
                            {totals.net >= 0 ? 'Adv: ' : 'Due: '} ₹{Math.abs(totals.net).toLocaleString()}
                        </div>
                    </div>
                </div>

                <div className="passbook-form-card">
                    <form onSubmit={handleSubmit} className="ledger-form">
                        <div className="form-grid">
                            <div className="f-group"><label>Date</label><input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
                            <div className="f-group">
                                <label>Party Name</label>
                                <select value={formData.partyName} onChange={e => setFormData({...formData, partyName: e.target.value})} required>
                                    <option value="">-- Select Party --</option>
                                    {suppliers.map((s, i) => <option key={i} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="f-group">
                                <label>Type</label>
                                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                                    <option value="Payment Out">Paid (Gaya)</option>
                                    <option value="Payment In">Recv (Aaya)</option>
                                </select>
                            </div>
                            <div className="f-group"><label>Amount</label><input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="0.00" required /></div>
                        </div>
                        <div className="form-grid mt">
                            <div className="f-group"><label>Txn ID</label><input type="text" value={formData.txnId} onChange={e => setFormData({...formData, txnId: e.target.value})} placeholder="UTR No." /></div>
                            <div className="f-group grow"><label>Remark</label><input type="text" value={formData.remark} onChange={e => setFormData({...formData, remark: e.target.value})} placeholder="Narration..." /></div>
                            <button type="submit" className="save-btn" disabled={loading || !isAuthorized}>SAVE</button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="statement-bar no-print">
                <select value={filterParty} onChange={e => setFilterParty(e.target.value)}>
                    <option value="All">All Parties</option>
                    {suppliers.map((s, i) => <option key={i} value={s}>{s}</option>)}
                </select>
                <div className="date-inputs">
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    <span>to</span>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
                <button className="filter-btn" onClick={handleSearch}>Generate</button>
                <button className="reset-btn" onClick={resetFilters}>Reset</button>
                <button className="print-btn" onClick={() => window.print()}>🖨️ Print Statement</button>
            </div>

            {/* --- 🖨️ 100% PRINT SECTION --- */}
            <div className="printable-statement">
                <div className="print-only-header">
                    <h1>DHARA SHAKTI AGRO PRODUCTS</h1>
                    <p className="sub-title">Party Transaction Ledger</p>
                    <div className="header-meta">
                        <span>Party: <strong>{filterParty}</strong></span>
                        <span>Statement Date: {new Date().toLocaleDateString('en-IN')}</span>
                    </div>
                </div>

                <table className="passbook-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Narration / Txn ID</th>
                            <th className="text-right">Credit (In)</th>
                            <th className="text-right">Debit (Out)</th>
                            <th className="text-right">Balance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dataWithBalance.map((txn, i) => (
                            <tr key={txn._id || i}>
                                <td className="nowrap">{new Date(txn.date).toLocaleDateString('en-GB')}</td>
                                <td>
                                    <div className="bold">{txn.partyName}</div>
                                    <div className="remark-text" style={{fontSize: '11px'}}>{txn.remark || '---'}</div>
                                    <small className="txn-id-text">Ref: {txn.txnId || 'N/A'}</small>
                                </td>
                                <td className="text-right text-green">
                                    {txn.type === 'Payment In' ? `₹${Number(txn.amount).toLocaleString()}` : '-'}
                                </td>
                                <td className="text-right text-red">
                                    {txn.type === 'Payment Out' ? `₹${Number(txn.amount).toLocaleString()}` : '-'}
                                </td>
                                <td className={`text-right bold ${txn.currentBalance >= 0 ? 'text-blue' : 'text-orange'}`}>
                                    ₹{Math.abs(txn.currentBalance).toLocaleString()} {txn.currentBalance >= 0 ? 'Cr' : 'Dr'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="print-only-footer">
                    <div className="footer-summary">
                        <p>Total Credit: ₹{totals.totalIn.toLocaleString()}</p>
                        <p>Total Debit: ₹{totals.totalOut.toLocaleString()}</p>
                        <p className="bold">Closing Balance: ₹{Math.abs(totals.net).toLocaleString()} {totals.net >= 0 ? '(Adv)' : '(Due)'}</p>
                    </div>
                    <div className="signature-box">
                        <div className="sig-line" style={{borderTop: '1px solid black', width: '200px', marginTop: '50px'}}></div>
                        <p>Authorized Signatory</p>
                    </div>
                </div>
            </div>

            <CustomSnackbar open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} />
        </div>
    );
};

export default ExpenseManager;