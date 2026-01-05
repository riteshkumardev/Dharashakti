import React from "react";

const EWayFooter = ({ ewayBillNo }) => (
  <div style={{ 
    textAlign: "center", 
    marginTop: 40, 
    borderTop: "1px dashed #999", 
    paddingTop: 10,
    fontSize: "14px"
  }}>
    <p style={{ margin: 0, color: "#555" }}>This is a computer generated E-Way Bill</p>
    
  </div>
);

export default EWayFooter;