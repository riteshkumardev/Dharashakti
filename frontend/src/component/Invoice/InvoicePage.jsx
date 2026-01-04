import React, { useState } from "react";
import EWayBillForm from "./EWayBillForm";
import EWayBillContainer from "./EWayBillContainer";

const InvoicePage = () => {
  const [ewayData, setEwayData] = useState({
    ewayBillNo: "871615409896",
    generatedDate: "11/12/2025 03:12 PM",
    validUpto: "13/12/2025",
    from: { name: "", gst: "", address: "" },
    to: { name: "", gst: "", address: "" },
    goods: [],
    transport: {},
    vehicle: {}
  });

  return (
    <>
      <EWayBillForm data={ewayData} setData={setEwayData} />
      <EWayBillContainer data={ewayData} />
    </>
  );
};

export default InvoicePage;