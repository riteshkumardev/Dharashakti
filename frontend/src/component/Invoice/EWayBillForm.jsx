import React from "react";
import "./ewayForm.css";

const EWayBillForm = ({ data, setData }) => {
  const update = (section, field, value) => {
    setData(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
  };

  return (
    <div className="eway-form-card no-print">
      <h2>🧾 E-Way Bill Form</h2>

      <input value={data.ewayBillNo} onChange={e=>setData({...data,ewayBillNo:e.target.value})} placeholder="E-Way Bill No" />

      <h3>From</h3>
      <input value={data.from.name} onChange={e=>update("from","name",e.target.value)} placeholder="Name" />
      <input value={data.from.gst} onChange={e=>update("from","gst",e.target.value)} placeholder="GST" />
      <input value={data.from.address} onChange={e=>update("from","address",e.target.value)} placeholder="Address" />

      <h3>To</h3>
      <input value={data.to.name} onChange={e=>update("to","name",e.target.value)} placeholder="Name" />
      <input value={data.to.gst} onChange={e=>update("to","gst",e.target.value)} placeholder="GST" />
      <input value={data.to.address} onChange={e=>update("to","address",e.target.value)} placeholder="Address" />
    </div>
  );
};

export default EWayBillForm;