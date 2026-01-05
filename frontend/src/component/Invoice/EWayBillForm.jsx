import React from "react";
import "./ewayForm.css";

const EWayBillForm = ({ data, setData, onPreview }) => {
  
  // Naya item add karne ka function
  const addNewItem = () => {
    const newItem = {
      hsn: "",
      product: "",
      quantity: 0,
      rate: 0,
      taxRate: 5, // default tax
      taxableAmount: 0
    };
    setData({ ...data, goods: [...data.goods, newItem] });
  };

  // Item delete karne ka function
  const removeItem = (index) => {
    const updatedGoods = data.goods.filter((_, i) => i !== index);
    calculateTotal(updatedGoods);
  };

  // Kisi specific item ko update karne ka function
  const updateGoods = (index, field, value) => {
    const updatedGoods = [...data.goods];
    updatedGoods[index] = { ...updatedGoods[index], [field]: value };

    // Individual item ki taxable calculation
    const qty = Number(updatedGoods[index].quantity) || 0;
    const rate = Number(updatedGoods[index].rate) || 0;
    updatedGoods[index].taxableAmount = qty * rate;

    calculateTotal(updatedGoods);
  };

  // Poore form ka total calculation
  const calculateTotal = (updatedGoods) => {
    let totalTaxable = 0;
    let totalIgst = 0;

    updatedGoods.forEach(item => {
      const taxable = Number(item.taxableAmount) || 0;
      const taxRate = Number(item.taxRate) || 0;
      totalTaxable += taxable;
      totalIgst += (taxable * taxRate) / 100;
    });

    setData({
      ...data,
      goods: updatedGoods,
      taxSummary: {
        taxable: totalTaxable,
        cgst: 0,
        sgst: 0,
        igst: totalIgst,
        total: totalTaxable + totalIgst
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

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Goods Details</h3>
          <button onClick={addNewItem} style={{ background: '#28a745', color: 'white', border: 'none', padding: '5px 15px', borderRadius: '4px', cursor: 'pointer' }}>
            + Add Item
          </button>
        </div>

        {/* Dynamic Items Mapping */}
        {data.goods.map((item, index) => (
          <div className="eway-form-grid" key={index} style={{ marginBottom: '10px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
            <input placeholder="HSN" value={item.hsn} onChange={e => updateGoods(index, "hsn", e.target.value)} />
            <select value={item.product} onChange={e => updateGoods(index, "product", e.target.value)}>
              <option value="">Select Product</option>
              <option value="Corn Grit">Corn Grit</option>
              <option value="Rice Grit">Rice Grit</option>
              <option value="Cattle Feed">Cattle Feed</option>
              <option value="Corn Flour">Corn Flour</option>
            </select>
            <input placeholder="Qty (KG)" type="number" value={item.quantity} onChange={e => updateGoods(index, "quantity", e.target.value)} />
            <input placeholder="Rate" type="number" value={item.rate} onChange={e => updateGoods(index, "rate", e.target.value)} />
            <input placeholder="Tax %" type="number" value={item.taxRate} onChange={e => updateGoods(index, "taxRate", e.target.value)} />
            
            {data.goods.length > 1 && (
              <button onClick={() => removeItem(index)} style={{ background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Delete
              </button>
            )}
          </div>
        ))}

        <h3>Tax Summary (Auto)</h3>
        <div className="eway-form-grid">
          <div className="read-only-box">Taxable: ₹{data.taxSummary.taxable.toFixed(2)}</div>
          <div className="read-only-box">IGST: ₹{data.taxSummary.igst.toFixed(2)}</div>
          <div className="read-only-box">Total: ₹{data.taxSummary.total.toFixed(2)}</div>
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