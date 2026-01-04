import React from "react";

const TaxSummary = ({ tax = {} }) => {
  const { taxable = 0, cgst = 0, sgst = 0, igst = 0, total = 0 } = tax;

  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "10px",
    border: "1px solid #000"
  };

  const cellStyle = {
    border: "1px solid #000",
    padding: "8px",
    textAlign: "right"
  };

  return (
    <div style={{ width: "100%", display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
      <table style={{ width: "40%", borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <td style={cellStyle}>Total Taxable</td>
            <td style={cellStyle}>{taxable.toFixed(2)}</td>
          </tr>
          <tr>
            <td style={cellStyle}>CGST (0%)</td>
            <td style={cellStyle}>{cgst.toFixed(2)}</td>
          </tr>
          <tr>
            <td style={cellStyle}>SGST (0%)</td>
            <td style={cellStyle}>{sgst.toFixed(2)}</td>
          </tr>
          <tr>
            <td style={cellStyle}>IGST</td>
            <td style={cellStyle}>{igst.toFixed(2)}</td>
          </tr>
          <tr style={{ background: "#f2f2f2" }}>
            <td style={{ ...cellStyle, fontWeight: "bold" }}>Total Amount</td>
            <td style={{ ...cellStyle, fontWeight: "bold" }}>{total.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default TaxSummary;