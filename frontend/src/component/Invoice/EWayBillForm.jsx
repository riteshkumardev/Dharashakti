import React from "react";
import "./ewayForm.css";

const EWayBillForm = ({ data, setData, onPreview }) => {
  const updateGoods = (field, value) => {
    const updatedGoods = [...data.goods];
    updatedGoods[0] = { ...updatedGoods[0], [field]: value };

    // Auto Calculation
    const qty = Number(updatedGoods[0].quantity) || 0;
    const rate = Number(updatedGoods[0].rate) || 0;
    const taxRate = Number(updatedGoods[0].taxRate) || 0;

    const taxable = qty * rate;
    const igst = (taxable * taxRate) / 100;
    
    updatedGoods[0].taxableAmount = taxable;

    setData({
      ...data,
      goods: updatedGoods,
      taxSummary: {
        taxable: taxable,
        cgst: 0,
        sgst: 0,
        igst: igst,
        total: taxable + igst
      }
    });
  };

  return (
    <div className="eway-form-page no-print">
      <div className="eway-form-card">
        <h2>📄 E-Way Bill Form</h2>

        <div className="eway-form-grid">
          <input type="date" value={data.date} onChange={e => setData({ ...data, date: e.target.value })} />
          <input placeholder="Vehicle No" value={data.vehicle.vehicleNo} onChange={e => setData({ ...data, vehicle: { ...data.vehicle, vehicleNo: e.target.value } })} />
          <input placeholder="E-Way Bill No" value={data.ewayBillNo} onChange={e => setData({ ...data, ewayBillNo: e.target.value })} />
        </div>

        <h3>To Party</h3>
        <div className="eway-form-grid">
          <input placeholder="Buyer Name" value={data.to.name} onChange={e => setData({ ...data, to: { ...data.to, name: e.target.value } })} />
          <input placeholder="Buyer GSTIN" value={data.to.gst} onChange={e => setData({ ...data, to: { ...data.to, gst: e.target.value } })} />
          <input placeholder="Buyer Address" value={data.to.address} onChange={e => setData({ ...data, to: { ...data.to, address: e.target.value } })} />
        </div>

        <h3>Goods Details</h3>
        <div className="eway-form-grid">
          <input placeholder="HSN Code" value={data.goods[0].hsn} onChange={e => updateGoods("hsn", e.target.value)} />
          <select value={data.goods[0].product} onChange={e => updateGoods("product", e.target.value)}>
            <option value="">Select Product</option>
            <option value="Corn Grit">Corn Grit</option>
            <option value="Rice Grit">Rice Grit</option>
            <option value="Cattle Feed">Cattle Feed</option>
            <option value="Corn Flour">Corn Flour</option>
          </select>
          <input placeholder="Quantity (KG)" type="number" value={data.goods[0].quantity} onChange={e => updateGoods("quantity", e.target.value)} />
          <input placeholder="Rate (per KG)" type="number" value={data.goods[0].rate} onChange={e => updateGoods("rate", e.target.value)} />
          <input placeholder="Tax Rate (%)" type="number" value={data.goods[0].taxRate} onChange={e => updateGoods("taxRate", e.target.value)} />
        </div>

        <h3>Tax Summary (Auto)</h3>
        <div className="eway-form-grid">
          <div className="read-only-box">Taxable: {data.taxSummary.taxable}</div>
          <div className="read-only-box">IGST: {data.taxSummary.igst}</div>
          <div className="read-only-box">Total: {data.taxSummary.total}</div>
        </div>

        <div className="eway-action-bar" style={{textAlign: 'center', marginTop: '20px'}}>
          <button onClick={onPreview} style={{padding: '10px 40px', cursor: 'pointer', background: '#007bff', color: '#fff', border: 'none', borderRadius: '5px'}}>
            👁️ Preview Bill
          </button>
        </div>
      </div>
    </div>
  );
};

export default EWayBillForm;