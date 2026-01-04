
import React from "react";

const EWayHeader = ({ data }) => (
  <div style={{ borderBottom: "2px solid black", marginBottom: 10 }}>
    <h2 style={{ textAlign: "center" }}>e-Way Bill</h2>
    <div>
      <strong>eWay Bill No:</strong> {data.ewayBillNo} <br />
      <strong>Generated Date:</strong> {data.generatedDate} <br />
      <strong>Valid Upto:</strong> {data.validUpto}
    </div>
  </div>
);

export default EWayHeader;
