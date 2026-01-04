
import React from "react";

const TransportDetails = ({ transport }) => (
  <div>
    <h4>Transport Details</h4>
    <p>Doc No: {transport.docNo}</p>
    <p>Date: {transport.docDate}</p>
  </div>
);

export default TransportDetails;
