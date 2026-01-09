import React, { useMemo } from "react";
import "./Alert.css";

const OverdueAlerts = ({ salesData = [], purchaseData = [], daysLimit = 10, onViewDetails }) => {
  
  // ✨ Logic: Group Sales by Customer Name
  const salesGrouped = useMemo(() => {
    const today = new Date();
    const limitDate = new Date();
    limitDate.setDate(today.getDate() - daysLimit);

    const groups = {};

    salesData.forEach(s => {
      const billDate = new Date(s.date);
      const due = Number(s.paymentDue || (Number(s.totalAmount) - Number(s.amountReceived || 0)));
      
      if (due > 0 && billDate < limitDate) {
        if (!groups[s.customerName]) {
          groups[s.customerName] = {
            customerName: s.customerName,
            mobile: s.mobile,
            totalDue: 0,
            billNumbers: [],
            latestBill: s // View action ke liye
          };
        }
        groups[s.customerName].totalDue += due;
        groups[s.customerName].billNumbers.push(s.billNo);
      }
    });

    return Object.values(groups).sort((a, b) => b.totalDue - a.totalDue);
  }, [salesData, daysLimit]);

  // 🚩 Purchase logic remains similar but grouped by Supplier
  const purchaseGrouped = useMemo(() => {
    const today = new Date();
    const limitDate = new Date();
    limitDate.setDate(today.getDate() - daysLimit);
    
    const groups = {};
    purchaseData.forEach(p => {
      const balance = Number(p.balanceAmount || 0);
      if (balance > 0 && new Date(p.date) < limitDate) {
        if (!groups[p.supplierName]) {
          groups[p.supplierName] = {
            supplierName: p.supplierName,
            totalBalance: 0,
            billNumbers: [],
            latestBill: p
          };
        }
        groups[p.supplierName].totalBalance += balance;
        groups[p.supplierName].billNumbers.push(p.billNo || "N/A");
      }
    });
    return Object.values(groups);
  }, [purchaseData, daysLimit]);

  if (salesGrouped.length === 0 && purchaseGrouped.length === 0) return null;

  return (
    <div className="overdue-3d-wrapper">
      <div className="overdue-flex-container">
        
        {/* --- LEFT SIDE: SALES (Grouped) --- */}
        {salesGrouped.length > 0 && (
          <div className="container-3d sales-3d flex-item">
            <div className="header-3d">
              <span className="icon-3d">🔴</span>
              <h4>Grouped Sales Overdue <span className="count-badge">{salesGrouped.length} Customers</span></h4>
            </div>
            <div className="scroll-area-3d">
              {salesGrouped.map(group => {
                const billsStr = group.billNumbers.join(", ");
                const waMessage = encodeURIComponent(
                  `Namaste ${group.customerName},\nDhara Shakti Agro se reminder hai ki aapke Total ${group.billNumbers.length} bills (Nos: ${billsStr}) ka kul ₹${group.totalDue.toLocaleString()} pending hai. Kripya jald se jald payment clear karein.`
                );

                return (
                  <div key={group.customerName} className="card-3d">
                    <div className="info">
                      <p className="name">{group.customerName}</p>
                      <p className="amt-3d red-text">Total Due: ₹{group.totalDue.toLocaleString()}</p>
                      <p className="sub">Bills: {billsStr}</p>
                    </div>
                    <div className="actions-3d">
                       <button className="btn-3d view" onClick={() => onViewDetails(group.latestBill, 'SALE')}>View</button>
                       <a href={`https://wa.me/${group.mobile}?text=${waMessage}`} target="_blank" rel="noreferrer" className="btn-3d whatsapp-icon-btn">
                        <svg viewBox="0 0 448 512" width="18" height="18" fill="currentColor"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.1 0-65.6-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-5.6-2.8-23.6-8.7-45-27.7-16.6-14.8-27.8-33.1-31.1-38.6-3.2-5.6-.3-8.6 2.5-11.4 2.5-2.5 5.5-6.5 8.3-9.7 2.8-3.2 3.7-5.5 5.6-9.2 1.9-3.7 1-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 13.2 5.8 23.5 9.2 31.5 11.8 13.3 4.2 25.4 3.6 35 2.2 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>
                       </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- RIGHT SIDE: PURCHASE (Grouped) --- */}
        {purchaseGrouped.length > 0 && (
          <div className="container-3d purchase-3d flex-item">
            <div className="header-3d">
              <span className="icon-3d">🟠</span>
              <h4>Purchase Payables <span className="count-badge orange">{purchaseGrouped.length} Suppliers</span></h4>
            </div>
            <div className="scroll-area-3d">
              {purchaseGrouped.map(group => (
                <div key={group.supplierName} className="card-3d">
                  <div className="info">
                    <p className="name">{group.supplierName}</p>
                    <p className="amt-3d orange-text">Total Balance: ₹{group.totalBalance.toLocaleString()}</p>
                    <p className="sub">Bills: {group.billNumbers.join(", ")}</p>
                  </div>
                  <button className="btn-3d view" onClick={() => onViewDetails(group.latestBill, 'PURCHASE')}>View</button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default OverdueAlerts;