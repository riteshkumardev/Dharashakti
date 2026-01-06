import React, { useState } from "react";
import EWayBillForm from "./EWayBillForm";
import EWayBillContainer from "../EWayBill/EWayBillContainer";

const InvoicePage = () => {
  const [ewayData, setEwayData] = useState({
    billNo: "871615409896",
    generatedDate: new Date().toLocaleDateString(),
    validUpto: "",
    date: "",
    from: {
      name: "M/S DHARA SHAKTI AGRO PRODUCTS",
      gst: "10DZTPM1457E1ZE",
      address: "Sri Pur Gahar, Khanpur, Samastipur, Bihar-848117",
      Mob:" 7325055939, 8102720905"
    },
    to: { name: "", gst: "", address: "" },
    goods: [
      {
        hsn: "",
        product: "",
        quantity: "",
        rate: "", // Naya field
        taxableAmount: 0,
        taxRate: ""
      }
    ],
    taxSummary: {
      taxable: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      total: 0
    },
    transport: { docNo: "", docDate: "" },
    vehicle: { vehicleNo: "", from: "" }
  });

  const [showPreview, setShowPreview] = useState(false);

  return (
    <>
      {!showPreview && (
        <>
          <EWayBillForm 
            data={ewayData} 
            setData={setEwayData} 
            onPreview={() => setShowPreview(true)} 
          />
        </>
      )}

      {showPreview && (
        <>
          <div className="no-print" style={{ textAlign: "center", marginBottom: 20 }}>
            <button
              onClick={() => setShowPreview(false)}
              style={{
                padding: "10px 24px",
                fontSize: 16,
                borderRadius: 8,
                cursor: "pointer",
                backgroundColor: "#f44336",
                color: "white",
                border: "none"
              }}
            >
              ✏️ Edit Form
            </button>
          </div>
          <EWayBillContainer data={ewayData} />
        </>
      )}
    </>
  );
};

export default InvoicePage;