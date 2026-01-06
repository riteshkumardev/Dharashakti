import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ewayForm.css";

const EWayBillForm = ({ data, setData, onPreview }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [showDriverList, setShowDriverList] = useState(false);
  const [loading, setLoading] = useState(false);

  const HSN_MASTER = {
    "Corn Grit": "11031300",
    "Rice Grit": "10064000",
    "Cattle Feed": "23099010",
    "Corn Flour": "11022000"
  };

  useEffect(() => {
    const fetchLatestBill = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/sales/latest-bill-no");
        const nextBillNo = res.data.success ? Number(res.data.nextBillNo) : 169;
        
        setData(prev => ({ 
          ...prev, 
          billNo: nextBillNo,
          date: new Date().toISOString().split('T')[0] 
        }));
      } catch (error) {
        console.error("Error fetching bill no:", error);
        setData(prev => ({ ...prev, billNo: "" }));
      }
    };
    fetchLatestBill();
  }, [setData]);

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

  const handleFinalSubmit = async () => {
    if (!data.billNo || !data.to.name || !data.goods || data.goods[0].quantity <= 0) {
      alert("Please fill Bill Number, Customer and Goods details!");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        billNo: Number(data.billNo),
        date: data.date,
        customerName: data.to.name,
        customerGSTIN: data.to.gst,
        customerAddress: data.to.address,
        vehicleNo: data.vehicle.vehicleNo,
        driverName: data.vehicle.driverName,
        driverPhone: data.vehicle.driverPhone,
        goods: data.goods,
        freight: Number(data.freight),
        taxableValue: Number(data.taxSummary.taxable),
        cgst: Number(data.taxSummary.cgst),
        sgst: Number(data.taxSummary.sgst),
        igst: Number(data.taxSummary.igst),
        totalAmount: Number(data.taxSummary.total),
        remarks: data.remarks || ""
      };

      const res = await axios.post("http://localhost:5000/api/sales", payload);

      if (res.data.success) {
        alert("Bill Saved Successfully!");
        onPreview(); 
      }
    } catch (error) {
      console.error("Submit failed:", error.response?.data || error.message);
      alert("Error saving bill: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    const newItem = { hsn: "", product: "", quantity: 0, rate: 0, taxRate: 0, taxableAmount: 0 };
    setData({ ...data, goods: [...data.goods, newItem] });
  };

  const handleRemoveItem = (index) => {
    const updatedGoods = data.goods.filter((_, i) => i !== index);
    calculateTotal(updatedGoods, data.freight);
  };

  const handleSelectSupplier = (e) => {
    const selectedName = e.target.value;
    const s = suppliers.find(item => item.name === selectedName);
    if (s) {
      setData({ ...data, to: { name: s.name, gst: s.gstin, address: s.address, phone: s.phone } });
    } else {
      setData({ ...data, to: { name: "", gst: "", address: "", phone: "" } });
    }
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
    
    const totalQty = updatedGoods.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    calculateTotal(updatedGoods, totalQty * 0.80);
  };

  const calculateTotal = (updatedGoods, freightVal) => {
    let totalTaxable = 0;
    let totalIgst = 0;
    let totalQty = 0;

    updatedGoods.forEach(item => {
      const taxable = Number(item.taxableAmount) || 0;
      totalTaxable += taxable;
      totalIgst += (taxable * (Number(item.taxRate) || 0)) / 100;
      totalQty += Number(item.quantity) || 0;
    });

    const fAmount = freightVal !== null ? Number(freightVal) : totalQty * 0.80;

    setData({
      ...data,
      goods: updatedGoods,
      freight: fAmount,
      taxSummary: {
        taxable: totalTaxable,
        cgst: totalIgst / 2,
        sgst: totalIgst / 2,
        igst: totalIgst,
        total: (totalTaxable + totalIgst) - fAmount 
      }
    });
  };

  return (
    <div className="eway-form-page no-print">
      <div className="eway-form-card">
        <h2>📄 E-Way Bill Form</h2>

        <div className="eway-form-grid" style={{ background: '#eef2f7', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
          <div className="form-group">
            <label>Bill Number (Manual Edit)</label>
            <input 
              type="number"
              style={{ fontWeight: 'bold' }} 
              value={data.billNo || ""} 
              onChange={(e) => setData({ ...data, billNo: e.target.value })} 
              placeholder="Enter Bill No"
            />
          </div>
          <div className="form-group">
            <label>Date</label>
            <input type="date" value={data.date || ""} onChange={(e) => setData({ ...data, date: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Vehicle No</label>
            <input placeholder="BR11..." value={data.vehicle.vehicleNo} onChange={e => setData({ ...data, vehicle: { ...data.vehicle, vehicleNo: e.target.value } })} />
          </div>
        </div>

        <div className="eway-form-grid">
          <div className="form-group">
            <label>Select Customer</label>
            {/* ✅ Customer Input ko Select Box mein badal diya */}
            <select 
              value={data.to.name} 
              onChange={handleSelectSupplier}
              className="customer-select"
            >
              <option value="">-- Choose Customer --</option>
              {suppliers.map(s => (
                <option key={s._id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>
          
          <div style={{ position: 'relative' }}>
            <label>Driver Search</label>
            <input placeholder="Search Driver..." value={data.vehicle.driverName || ""} onFocus={() => setShowDriverList(true)} onChange={e => setData({...data, vehicle: {...data.vehicle, driverName: e.target.value}})} />
            {showDriverList && (
              <div className="search-dropdown">
                {drivers.filter(d => d.name.toLowerCase().includes((data.vehicle.driverName || "").toLowerCase())).map(d => (
                  <div key={d._id} className="dropdown-item" onClick={() => handleSelectDriver(d)}>{d.name}</div>
                ))}
              </div>
            )}
          </div>
          <div className="form-group">
            <label>Driver Mobile</label>
            <input placeholder="Driver Phone" value={data.vehicle.driverPhone || ""} onChange={e => setData({ ...data, vehicle: { ...data.vehicle, driverPhone: e.target.value } })} />
          </div>
        </div>

        <button onClick={handleAddItem} className="add-item-btn" style={{ margin: '15px 0' }}>+ Add Item</button>

        {data.goods.map((item, index) => (
          <div className="eway-form-grid" key={index} style={{ borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
            <select value={item.product} onChange={e => updateGoods(index, "product", e.target.value)}>
              <option value="">Product</option>
              <option value="Corn Grit">Corn Grit</option>
              <option value="Rice Grit">Rice Grit</option>
              <option value="Cattle Feed">Cattle Feed</option>
            </select>
            <input placeholder="Qty" type="number" value={item.quantity} onChange={e => updateGoods(index, "quantity", e.target.value)} />
            <input placeholder="Rate" type="number" value={item.rate} onChange={e => updateGoods(index, "rate", e.target.value)} />
            <input placeholder="Tax %" type="number" value={item.taxRate} onChange={e => updateGoods(index, "taxRate", e.target.value)} />
            <button onClick={() => handleRemoveItem(index)} className="del-btn">✖</button>
          </div>
        ))}

        <div className="eway-form-grid" style={{ marginTop: '20px' }}>
          <div>
            <label>Freight (Auto: 0.80/kg)</label>
            <input type="number" value={data.freight || ""} onChange={(e) => calculateTotal(data.goods, e.target.value)} />
          </div>
          <div className="read-only-box">
             <strong>Grand Total: ₹{Number(data.taxSummary.total).toLocaleString()}</strong>
          </div>
        </div>

        <button onClick={handleFinalSubmit} disabled={loading} className="preview-btn" style={{ width: '100%', marginTop: '20px', background: loading ? '#ccc' : '#007bff' }}>
          {loading ? "Saving..." : "👁️ Save & Preview Bill"}
        </button>
      </div>
    </div>
  );
};

export default EWayBillForm;