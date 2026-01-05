import React from "react";

const GoodsTable = ({ goods = [] }) => (
  <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "15px" }}>
    <thead>
      <tr style={{ background: "#f2f2f2" }}>
        <th style={{ border: "1px solid #000", padding: "8px", textAlign: "center" }}>HSN</th>
        <th style={{ border: "1px solid #000", padding: "8px", textAlign: "center" }}>Product</th>
        <th style={{ border: "1px solid #000", padding: "8px", textAlign: "center" }}>Quantity</th>
        <th style={{ border: "1px solid #000", padding: "8px", textAlign: "center" }}>Rate</th>
        <th style={{ border: "1px solid #000", padding: "8px", textAlign: "center" }}>Total Amt</th>
     
      </tr>
    </thead>
    <tbody>
      {goods.length > 0 ? (
        goods.map((g, i) => (
          <tr key={i}>
            <td style={{ border: "1px solid #000", padding: "8px", textAlign: "center" }}>{g.hsn || "11031300"}</td>
            <td style={{ border: "1px solid #000", padding: "8px" }}>{g.product}</td>
            <td style={{ border: "1px solid #000", padding: "8px", textAlign: "center" }}>{g.quantity}</td>
            <td style={{ border: "1px solid #000", padding: "8px", textAlign: "center" }}>{g.rate}</td>
            <td style={{ border: "1px solid #000", padding: "8px", textAlign: "center" }}>{Number(g.taxableAmount).toFixed(2)}</td>
        
          </tr>
        ))
      ) : (
        <tr><td colSpan="6" style={{ textAlign: "center", padding: "10px" }}>No Items Added</td></tr>
      )}
    </tbody>
  </table>
);

export default GoodsTable;