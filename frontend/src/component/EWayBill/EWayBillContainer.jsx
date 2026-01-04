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

  // 🔹 QR DATA (important info only)
  const qrData = `
E-Way Bill No: ${data.ewayBillNo}
From: ${data.from.name}
To: ${data.to.name}
Vehicle: ${data.vehicle.vehicleNo}
Total Amount: ${data.taxSummary.total}
Valid Upto: ${data.validUpto}
  `.trim();

  return (
    <div className="eway-wrapper">
      <div className="eway-container">

        {/* ===== TOP BAR ===== */}
    <div className="eway-top">
  <div className="no-print">
    <button onClick={() => window.print()}>
      🖨️ Print E-Way Bill
    </button>
  </div>

  <div className="qr-box">
    <QRCodeCanvas
      value={qrData}
      size={90}
      level="M"
    />
  </div>
</div>

        {/* ===== BILL CONTENT ===== */}
        <EWayHeader data={data} />
        <PartyDetails from={data.from} to={data.to} />
        <GoodsTable goods={data.goods} />
        <TaxSummary tax={data.taxSummary} />
        <TransportDetails transport={data.transport} />
        <VehicleDetails vehicle={data.vehicle} />
        <EWayFooter ewayBillNo={data.ewayBillNo} />

      </div>
    </div>
  );
};

export default EWayBillContainer;
