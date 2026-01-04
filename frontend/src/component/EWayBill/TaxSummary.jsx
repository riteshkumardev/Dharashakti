
import React from "react";

const TaxSummary = ({ tax }) => (
  <table>
    <tbody>
      <tr><td>Total Taxable</td><td>{tax.taxable}</td></tr>
      <tr><td>CGST</td><td>{tax.cgst}</td></tr>
      <tr><td>SGST</td><td>{tax.sgst}</td></tr>
      <tr><td>IGST</td><td>{tax.igst}</td></tr>
      <tr><td>Total</td><td><b>{tax.total}</b></td></tr>
    </tbody>
  </table>
);

export default TaxSummary;
