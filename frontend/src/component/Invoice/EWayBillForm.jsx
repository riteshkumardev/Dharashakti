import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ewayForm.css";

const EWayBillForm = ({ data, setData, onPreview }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [showSupplierList, setShowSupplierList] = useState(false);
  const [showDriverList, setShowDriverList] = useState(false);

  const HSN_MASTER = {
    "Corn Grit": "11031300",
    "Rice Grit": "10064000",
    "Cattle Feed": "23099010",
    "Corn Flour": "11022000"
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supRes = await axios.get("http://localhost:5000/api/suppliers/list");
        const empRes = await axios.get("http://localhost:5000/api/employees"); 
        if (supRes.data.success) setSuppliers(supRes.data.data);
        if (empRes.data.success) {
          const onlyDrivers = empRes.data.data.filter(emp => 
            emp.role?.toLowerCase() === 'driver' || emp.designation?.toLowerCase() === 'driver'
          );
          setDrivers(onlyDrivers);
        }
      } catch (error) { console.error("Data loading failed", error); }
    };
    fetchData();
  }, []);

  // ✅ Auto-set Date to Today if empty
  useEffect(() => {
    if (!data.date) {
      const today = new Date().toISOString().split('T')[0];
      setData(prev => ({ ...prev, date: today }));
    }
  }, []);

  const handleAddItem = () => {
    const newItem = { hsn: "", product: "", quantity: 0, rate: 0, taxRate: 5, taxableAmount: 0 };
    const updatedGoods = [...data.goods, newItem];
    calculateTotal(updatedGoods, null);
  };

  const handleRemoveItem = (index) => {
    const updatedGoods = data.goods.filter((_, i) => i !== index);
    calculateTotal(updatedGoods, null);
  };

  const handleSelectSupplier = (s) => {
    setData({ ...data, to: { name: s.name, gst: s.gstin, address: s.address } });
    setShowSupplierList(false);
  };

  const handleSelectDriver = (d) => {
    setData({ ...data, vehicle: { ...data.vehicle, driverName: d.name, driverPhone: d.phone } });
    setShowDriverList(false);
  };

  const updateGoods = (index, field, value) => {
    const updatedGoods = [...data.goods];
    if (field === "product") {
      updatedGoods[index].product = value;
      updatedGoods[index].hsn = HSN_MASTER[value] || ""; 
    } else {
      updatedGoods[index][field] = value;
    }

    const qty = Number(updatedGoods[index].quantity) || 0;
    const rate = Number(updatedGoods[index].rate) || 0;
    updatedGoods[index].taxableAmount = qty * rate;
    
    // Auto-calculate freight based on NEW total quantity
    const totalQty = updatedGoods.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    calculateTotal(updatedGoods, totalQty * 0.80);
  };

  const calculateTotal = (updatedGoods, freightVal) => {
    let totalTaxable = 0;
    let totalIgst = 0;
    
    updatedGoods.forEach(item => {
      const taxable = Number(item.taxableAmount) || 0;
      totalTaxable += taxable;
      totalIgst += (taxable * (Number(item.taxRate) || 0)) / 100;
    });

    // Agar freightVal pass nahi kiya (null hai), toh purana freight hi use karein
    const fAmount = freightVal !== null ? Number(freightVal) : Number(data.freight) || 0;

    setData({
      ...data,
      goods: updatedGoods,
      freight: fAmount,
      taxSummary: {
        taxable: totalTaxable,
        cgst: totalIgst / 2,
        sgst: totalIgst / 2,
        igst: totalIgst,
        total: totalTaxable + totalIgst + fAmount 
      }
    });
  };

  return (
    <div className="eway-form-page no-print">
      <div className="eway-form-card">
        <h2>📄 E-Way Bill Form</h2>

        {/* --- Transport & Driver --- */}
        <h3>Transport & Driver Details</h3>
        <div className="eway-form-grid" style={{ position: 'relative' }}>
          <div className="form-group">
            <label>Bill Date</label>
            <input 
              type="date" 
              // ✅ Date shifted to main data.date for better printing
              value={data.date || ""} 
              onChange={(e) => setData({ ...data, date: e.target.value })} 
            />
          </div>
          <div className="form-group">
            <label>Vehicle No</label>
            <input placeholder="Vehicle No" value={data.vehicle.vehicleNo} onChange={e => setData({ ...data, vehicle: { ...data.vehicle, vehicleNo: e.target.value } })} />
          </div>
          <div className="form-group">
            <label>Driver Search</label>
            <input placeholder="Search Driver..." value={data.vehicle.driverName || ""} onFocus={() => setShowDriverList(true)} onChange={e => setData({...data, vehicle: {...data.vehicle, driverName: e.target.value}})} />
            {showDriverList && (
              <div className="search-dropdown">
                {drivers.filter(d => d.name.toLowerCase().includes((data.vehicle.driverName || "").toLowerCase())).map(d => (
                  <div key={d._id} className="dropdown-item" onClick={() => handleSelectDriver(d)}>{d.name} <small>({d.phone})</small></div>
                ))}
              </div>
            )}
          </div>
          <div className="form-group">
            <label>Driver Mobile</label>
            <input placeholder="Driver Phone" value={data.vehicle.driverPhone || ""} onChange={e => setData({...data, vehicle: {...data.vehicle, driverPhone: e.target.value}})} />
          </div>
        </div>

        {/* --- Supplier Section --- */}
        <h3>To Party (Supplier)</h3>
        <div className="eway-form-grid" style={{ position: 'relative' }}>
          <input placeholder="Search Buyer..." value={data.to.name} onFocus={() => setShowSupplierList(true)} onChange={e => setData({ ...data, to: { ...data.to, name: e.target.value } })} />
          {showSupplierList && (
            <div className="search-dropdown">
              {suppliers.filter(s => s.name.toLowerCase().includes(data.to.name.toLowerCase())).map(s => (
                <div key={s._id} className="dropdown-item" onClick={() => handleSelectSupplier(s)}>{s.name}</div>
              ))}
            </div>
          )}
          <input placeholder="Buyer GSTIN" value={data.to.gst} readOnly />
          <input placeholder="Buyer Address" value={data.to.address} readOnly />
        </div>

        {/* --- Goods Section --- */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
          <h3>Goods Details</h3>
          <button onClick={handleAddItem} className="add-item-btn">+ Add Item</button>
        </div>

        {data.goods.map((item, index) => (
          <div className="eway-form-grid" key={index} style={{ marginBottom: '10px', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
            <select value={item.product} onChange={e => updateGoods(index, "product", e.target.value)}>
              <option value="">Select Product</option>
              <option value="Corn Grit">Corn Grit</option>
              <option value="Rice Grit">Rice Grit</option>
              <option value="Cattle Feed">Cattle Feed</option>
            </select>
            <input placeholder="HSN" value={item.hsn} readOnly />
            <input placeholder="Qty" type="number" value={item.quantity} onChange={e => updateGoods(index, "quantity", e.target.value)} />
            <input placeholder="Rate" type="number" value={item.rate} onChange={e => updateGoods(index, "rate", e.target.value)} />
            <input placeholder="Tax %" type="number" value={item.taxRate} onChange={e => updateGoods(index, "taxRate", e.target.value)} />
            {data.goods.length > 1 && (
              <button onClick={() => handleRemoveItem(index)} className="del-btn">Delete</button>
            )}
          </div>
        ))}

        {/* --- Totals --- */}
        <div className="eway-form-grid" style={{marginTop: '20px', background: '#f9f9f9', padding: '15px', borderRadius: '8px'}}>
          <div>
            <label>Freight Charges (Auto: Qty * 0.80)</label>
            <input 
              type="number" 
              value={data.freight || ""} 
              onChange={(e) => calculateTotal(data.goods, e.target.value)} 
            />
          </div>
          <div className="read-only-box">
             <strong>Grand Total: ₹{data.taxSummary.total.toLocaleString()}</strong>
          </div>
        </div>

        <div style={{textAlign: 'center', marginTop: '20px'}}>
          <button onClick={onPreview} className="preview-btn">👁️ Preview & Print Bill</button>
        </div>
      </div>
    </div>
  );
};

export default EWayBillForm;