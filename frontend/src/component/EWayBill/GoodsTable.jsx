import React from "react";

const GoodsTable = ({ goods }) => (
  <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "15px" }}>
    <thead>
      <tr style={{ background: "#f2f2f2" }}>
        <th style={{ border: "1px solid #000", padding: "8px" }}>HSN</th>
        <th style={{ border: "1px solid #000", padding: "8px" }}>Product</th>
        <th style={{ border: "1px solid #000", padding: "8px" }}>Quantity</th>
        <th style={{ border: "1px solid #000", padding: "8px" }}>Rate</th>
        <th style={{ border: "1px solid #000", padding: "8px" }}>Taxable Amt</th>
        <th style={{ border: "1px solid #000", padding: "8px" }}>Tax Rate</th>
      </tr>
    </thead>
    <tbody>
      {goods.map((g, i) => (
        <tr key={i}>
          <td style={{ border: "1px solid #000", padding: "8px", textAlign: "center" }}>{g.hsn}</td>
          <td style={{ border: "1px solid #000", padding: "8px" }}>{g.product}</td>
          <td style={{ border: "1px solid #000", padding: "8px", textAlign: "center" }}>{g.quantity}</td>
          <td style={{ border: "1px solid #000", padding: "8px", textAlign: "right" }}>{g.rate}</td>
          <td style={{ border: "1px solid #000", padding: "8px", textAlign: "right" }}>{g.taxableAmount}</td>
          <td style={{ border: "1px solid #000", padding: "8px", textAlign: "center" }}>{g.taxRate}%</td>
        </tr>
      ))}
    </tbody>
  </table>
);

export default GoodsTable;