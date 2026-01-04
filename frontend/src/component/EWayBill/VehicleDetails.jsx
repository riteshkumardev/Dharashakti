
import React from "react";

const VehicleDetails = ({ vehicle }) => (
  <div>
    <h4>Vehicle Details</h4>
    <p>Vehicle No: {vehicle.vehicleNo}</p>
    <p>From: {vehicle.enteredFrom}</p>
  </div>
);

export default VehicleDetails;
