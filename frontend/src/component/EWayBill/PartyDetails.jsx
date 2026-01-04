
import React from "react";

const PartyDetails = ({ from, to }) => (
  <table>
    <tbody>
      <tr>
        <th>From</th>
        <th>To</th>
      </tr>
      <tr>
        <td>
          <b>{from.name}</b><br/>
          GSTIN: {from.gstin}<br/>
          {from.address}
        </td>
        <td>
          <b>{to.name}</b><br/>
          GSTIN: {to.gstin}<br/>
          {to.address}
        </td>
      </tr>
    </tbody>
  </table>
);

export default PartyDetails;
