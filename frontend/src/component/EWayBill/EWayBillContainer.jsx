
import React from "react";
import "./ewaybill.css";
import EWayHeader from "./EWayHeader";
import PartyDetails from "./PartyDetails";
import GoodsTable from "./GoodsTable";
import TaxSummary from "./TaxSummary";
import TransportDetails from "./TransportDetails";
import VehicleDetails from "./VehicleDetails";
import EWayFooter from "./EWayFooter";

const EWayBillContainer = ({ data }) => {
  if (!data) return null;

  return (
    <div className="eway-container">
 <button className="no-print" onClick={() => window.print()}>
  🖨️ Print E-Way Bill
</button>


      <EWayHeader data={data} />
      <PartyDetails from={data.from} to={data.to} />
      <GoodsTable goods={data.goods} />
      <TaxSummary tax={data.taxSummary} />
      <TransportDetails transport={data.transport} />
      <VehicleDetails vehicle={data.vehicle} />
      <EWayFooter ewayBillNo={data.ewayBillNo} />
    </div>
  );
};

export default EWayBillContainer;
