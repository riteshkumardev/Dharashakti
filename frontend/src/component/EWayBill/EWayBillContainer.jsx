import React from "react";
import "./ewaybill.css";
import { QRCodeCanvas } from "qrcode.react";

import EWayHeader from "./EWayHeader";
import PartyDetails from "./PartyDetails";
import GoodsTable from "./GoodsTable";
import TaxSummary from "./TaxSummary";
import TransportDetails from "./TransportDetails";
import VehicleDetails from "./VehicleDetails";
import EWayFooter from "./EWayFooter";

const EWayBillContainer = ({ data }) => {
  if (!data) return null;
console.log(data,"data");

  // ✅ SAFE DESTRUCTURING (NO RUNTIME ERROR)
  const {
    ewayBillNo = "",
    validUpto = "",
    from = {},
    to = {},
    goods = [],
    transport = {},
    vehicle = {},
    taxSummary = { total: 0 }
  } = data;

  // 🔹 SAFE QR DATA
  const qrData = `
E-Way Bill No: ${ewayBillNo}
From: ${from?.name || ""}
To: ${to?.name || ""}
Vehicle: ${vehicle?.vehicleNo || ""}
Total Amount: ${taxSummary?.total || 0}
Valid Upto: ${validUpto}
`.trim();

  return (
    <div className="eway-wrapper">
      <div className="eway-container">

        {/* ===== TOP BAR ===== */}
        <div className="eway-top">
          <button className="print-btn no-print" onClick={() => window.print()}>
            🖨️ Print E-Way Bill
          </button>

          <div className="qr-box">
            <QRCodeCanvas value={qrData} size={90} level="M" />
          </div>
        </div>

        {/* ===== BILL CONTENT ===== */}
        <EWayHeader data={data} />
        <PartyDetails from={from} to={to} />
        <GoodsTable goods={goods} />
        <TaxSummary tax={taxSummary} />
        <TransportDetails transport={transport} />
        <VehicleDetails vehicle={vehicle} />
        <EWayFooter ewayBillNo={ewayBillNo} />

      </div>
    </div>
  );
};

export default EWayBillContainer;
