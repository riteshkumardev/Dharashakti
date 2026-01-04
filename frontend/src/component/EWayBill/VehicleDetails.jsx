import React from "react";

const VehicleDetails = ({ vehicle }) => (
  <div style={{ marginTop: 10, paddingBottom: 20 }}>
    <h4 style={{ margin: "0 0 5px 0" }}>Vehicle Details</h4>
    <div style={{ display: "flex", gap: "20px" }}>
      <span><strong>Vehicle No:</strong> {vehicle.vehicleNo || "---"}</span>
      <span><strong>From:</strong> {vehicle.from || "Bihar"}</span>
    </div>
  </div>
);

export default VehicleDetails;