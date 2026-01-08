import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // Navigation ke liye
import EWayBillContainer from "../EWayBill/EWayBillContainer";

/* =========================
    🔒 Helper (NaN Safe)
   ========================= */
const toSafeNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const InvoicePage = () => {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const navigate = useNavigate(); // Hook for redirection
  
  const [allSales, setAllSales] = useState([]); 
  const [searchTerm, setSearchTerm] = useState(""); 
  const [showPreview, setShowPreview] = useState(false);

  const [ewayData, setEwayData] = useState({
    billNo: "",
    generatedDate: new Date().toISOString().split("T")[0],
    validUpto: "",
    date: "",
    from: {
      name: "M/S DHARA SHAKTI AGRO PRODUCTS",
      gstin: "10DZTPM1457E1ZE",
      address: "Sri Pur Gahar, Khanpur, Samastipur, Bihar-848117",
      mobile: "7325055939, 8102720905",
    },
    to: { name: "", gstin: "", address: "" },
    goods: [{ hsn: "", product: "", quantity: 0, rate: 0, taxableAmount: 0, taxRate: 5 }],
    taxSummary: { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 },
    transport: { docNo: "", docDate: "" },
    vehicle: { vehicleNo: "", from: "" },
    freight: 0
  });

  useEffect(() => {
    const loadSales = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/sales`);
        if (res.data.success) setAllSales(res.data.data);
      } catch (err) {
        console.error("Sales load nahi ho payi", err);
      }
    };
    loadSales();
  }, [API_URL]);

  const recalcTaxSummary = (baseData) => {
    const taxable = baseData.goods.reduce((sum, g) => sum + toSafeNumber(g.taxableAmount), 0);
    const totalTax = baseData.goods.reduce((sum, g) => {
      const rate = toSafeNumber(g.taxRate || 5);
      return sum + (toSafeNumber(g.taxableAmount) * rate) / 100;
    }, 0);
    const freight = toSafeNumber(baseData.freight);

    return {
      ...baseData,
      taxSummary: {
        taxable: taxable,
        cgst: totalTax / 2,
        sgst: totalTax / 2,
        igst: totalTax,
        total: taxable + totalTax + freight,
      },
    };
  };

  const handleSelectSale = (sale) => {
    const mappedData = {
      ...ewayData,
      billNo: String(sale.billNo || ""),
      date: sale.date || "",
      to: {
        name: sale.customerName || "",
        gstin: sale.gstin || "", 
        address: sale.address || "",
      },
      goods: [
        {
          product: sale.productName || "Corn Grit",
          quantity: toSafeNumber(sale.quantity),
          rate: toSafeNumber(sale.rate),
          taxableAmount: toSafeNumber(sale.totalAmount || (sale.quantity * sale.rate)),
          taxRate: 5, 
          hsn: "2309", 
        },
      ],
      vehicle: {
        vehicleNo: sale.vehicleNo || "",
        from: "Samastipur",
      },
      freight: toSafeNumber(sale.freight)
    };

    const calculatedData = recalcTaxSummary(mappedData);
    setEwayData(calculatedData);
    setSearchTerm(""); 
    setShowPreview(true); // Selection ke baad seedhe preview dikhaye
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      
      {/* =========================
          🆕 Action Header Buttons
         ========================= */}
      <div className="no-print" style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "20px",
        gap: "15px"
      }}>
        <h2 style={{ margin: 0, color: "#333" }}>Print Invoices</h2>
        
        <button
          onClick={() => navigate("/sales-entry")} // Aapka Sales Entry wala path yahan likhein
          style={{
            padding: "12px 25px",
            fontSize: "16px",
            borderRadius: "8px",
            cursor: "pointer",
            backgroundColor: "#2196F3", // Blue color for new entry
            color: "white",
            border: "none",
            fontWeight: "bold",
            boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
          }}
        >
          ➕ Create New Bill
        </button>
      </div>

      {!showPreview && (
        <>
          {/* Search Box */}
          <div className="no-print" style={{ 
            background: "#fdf2f2", padding: "15px", borderRadius: "10px", 
            marginBottom: "20px", border: "1px solid #f44336", position: "relative" 
          }}>
            <h4 style={{ margin: "0 0 10px 0", color: "#d32f2f" }}>Search Bill to Print</h4>
            <input
              type="text"
              placeholder="Enter Bill No or Customer Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "100%", padding: "12px", borderRadius: "5px", border: "1px solid #ccc", fontSize: "16px" }}
            />
            
            {searchTerm && (
              <div style={{ 
                background: "white", border: "1px solid #ccc", maxHeight: "250px", 
                overflowY: "auto", position: "absolute", zIndex: 1000, 
                width: "calc(100% - 30px)", boxShadow: "0 4px 8px rgba(0,0,0,0.1)"
              }}>
                {allSales
                  .filter(s => {
                    const bNo = s.billNo ? String(s.billNo).toLowerCase() : "";
                    const cName = s.customerName ? String(s.customerName).toLowerCase() : "";
                    const search = searchTerm.toLowerCase();
                    return bNo.includes(search) || cName.includes(search);
                  })
                  .map(s => (
                    <div 
                      key={s._id} 
                      onClick={() => handleSelectSale(s)}
                      style={{ padding: "12px", borderBottom: "1px solid #eee", cursor: "pointer" }}
                      onMouseOver={(e) => e.target.style.background = "#fff5f5"}
                      onMouseOut={(e) => e.target.style.background = "white"}
                    >
                      <strong>Bill: {s.billNo}</strong> | {s.customerName} | {s.date}
                    </div>
                  ))
                }
              </div>
            )}
          </div>

          <div style={{ textAlign: "center", marginTop: "50px", color: "#888" }}>
            <p>Please search and select a bill from above to view the print preview.</p>
          </div>
        </>
      )}

      {showPreview && (
        <>
          <div className="no-print" style={{ 
            display: "flex", justifyContent: "center", gap: "20px", marginBottom: "30px" 
          }}>
            <button
              onClick={() => setShowPreview(false)}
              style={{ padding: "12px 25px", backgroundColor: "#607D8B", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "16px" }}
            >
              ⬅️ Back to Search
            </button>
            <button
              onClick={() => window.print()}
              style={{ padding: "12px 25px", backgroundColor: "#4CAF50", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "16px", fontWeight: "bold" }}
            >
              🖨️ Print Now
            </button>
          </div>
          
          <div id="printable-area">
             <EWayBillContainer data={ewayData} />
          </div>
        </>
      )}
    </div>
  );
};

export default InvoicePage;