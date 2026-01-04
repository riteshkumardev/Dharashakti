
import React from "react";

const GoodsTable = ({ goods }) => (
  <table>
    <thead>
      <tr>
        <th>HSN</th>
        <th>Product</th>
        <th>Quantity</th>
        <th>Taxable Amount</th>
        <th>Tax Rate</th>
      </tr>
    </thead>
    <tbody>
      {goods.map((g, i) => (
        <tr key={i}>
          <td>{g.hsn}</td>
          <td>{g.name}</td>
          <td>{g.qty}</td>
          <td>{g.taxableAmount}</td>
          <td>{g.taxRate}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

export default GoodsTable;
