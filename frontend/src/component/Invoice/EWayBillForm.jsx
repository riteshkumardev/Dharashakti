import React, { useState, useEffect } from "react";
import axios from "axios";
import "./ewayForm.css";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000";

/* =========================
   🔒 Helper (NaN Safe)
   ========================= */
const toSafeNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const EWayBillForm = ({ data, setData, onPreview }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [showDriverList, setShowDriverList] = useState(false);
  const [loading, setLoading] = useState(false);

  const HSN_MASTER = {
    "Corn Grit": "11031300",
    "Rice Grit": "10064000",
    "Cattle Feed": "23099010",
    "Corn Flour": "11022000",
  };

  /* =========================
     🔢 Fetch Latest Bill No
     ========================= */
  useEffect(() => {
    const fetchLatestBill = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/sales/latest-bill-no`
        );
        const nextBillNo =
          res.data?.success && Number.isFinite(Number(res.data.nextBillNo))
            ? Number(res.data.nextBillNo)
            : 1;

        setData((prev) => ({
          ...prev,
          billNo: nextBillNo,
          date: new Date().toISOString().split("T")[0],
        }));
      } catch (error) {
        console.error("Bill no fetch failed:", error);
      }
    };
    fetchLatestBill();
  }, [setData]);

  /* =========================
     📡 Fetch Suppliers & Drivers
     ========================= */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const supRes = await axios.get(
          `${API_BASE_URL}/api/suppliers/list`
        );
        const empRes = await axios.get(
          `${API_BASE_URL}/api/employees`
        );

        if (supRes.data?.success) setSuppliers(supRes.data.data);

        if (empRes.data?.success) {
          const onlyDrivers = empRes.data.data.filter(
            (e) =>
              e.role?.toLowerCase() === "driver" ||
              e.designation?.toLowerCase() === "driver"
          );
          setDrivers(onlyDrivers);
        }
      } catch (error) {
        console.error("Data loading failed:", error);
      }
    };
    fetchData();
  }, []);

  /* =========================
     🧮 Recalculate Totals
     ========================= */
  const calculateTotal = (goodsList, freightVal) => {
    let taxable = 0;
    let tax = 0;

    goodsList.forEach((g) => {
      const t = toSafeNumber(g.taxableAmount);
      taxable += t;
      tax += (t * toSafeNumber(g.taxRate)) / 100;
    });

    const freight = toSafeNumber(freightVal);

    setData({
      ...data,
      goods: goodsList,
      freight,
      taxSummary: {
        taxable,
        cgst: tax / 2,
        sgst: tax / 2,
        igst: tax,
        total: taxable + tax + freight,
      },
    });
  };

  /* =========================
     ✍️ Update Goods
     ========================= */
  const updateGoods = (index, field, value) => {
    const updatedGoods = [...data.goods];

    if (field === "product") {
      updatedGoods[index].product = value;
      updatedGoods[index].hsn = HSN_MASTER[value] || "";
    } else {
      updatedGoods[index][field] = value;
    }

    const qty = toSafeNumber(updatedGoods[index].quantity);
    const rate = toSafeNumber(updatedGoods[index].rate);
    updatedGoods[index].taxableAmount = qty * rate;

    calculateTotal(updatedGoods, data.freight);
  };

  const handleAddItem = () => {
    setData({
      ...data,
      goods: [
        ...data.goods,
        { hsn: "", product: "", quantity: 0, rate: 0, taxRate: 0, taxableAmount: 0 },
      ],
    });
  };

  const handleRemoveItem = (index) => {
    const updatedGoods = data.goods.filter((_, i) => i !== index);
    calculateTotal(updatedGoods, data.freight);
  };

  /* =========================
     👤 Select Supplier
     ========================= */
  const handleSelectSupplier = (e) => {
    const s = suppliers.find((x) => x.name === e.target.value);
    setData({
      ...data,
      to: s
        ? { name: s.name, gst: s.gstin, address: s.address, phone: s.phone }
        : { name: "", gst: "", address: "", phone: "" },
    });
  };

  /* =========================
     💾 Final Submit
     ========================= */
  const handleFinalSubmit = async () => {
    if (!data.billNo || !data.to?.name || data.goods.length === 0) {
      alert("Please fill Bill Number, Customer & Product!");
      return;
    }

    setLoading(true);
    try {
      const sanitizedGoods = data.goods.map((g) => ({
        product: g.product,
        hsn: g.hsn,
        quantity: toSafeNumber(g.quantity),
        rate: toSafeNumber(g.rate),
        taxRate: toSafeNumber(g.taxRate),
        taxableAmount: toSafeNumber(g.taxableAmount),
      }));

      const payload = {
        ...data,
        billNo: toSafeNumber(data.billNo),
        customerName: data.to.name,
        vehicleNo: data.vehicle?.vehicleNo || "",

        productName: sanitizedGoods[0].product,
        quantity: sanitizedGoods[0].quantity,
        rate: sanitizedGoods[0].rate,

        freight: toSafeNumber(data.freight),
        taxableValue: toSafeNumber(data.taxSummary.taxable),
        cgst: toSafeNumber(data.taxSummary.cgst),
        sgst: toSafeNumber(data.taxSummary.sgst),
        igst: toSafeNumber(data.taxSummary.igst),
        totalAmount: toSafeNumber(data.taxSummary.total),
        paymentDue:
          toSafeNumber(data.taxSummary.total) -
          toSafeNumber(data.amountReceived),

        goods: sanitizedGoods,
      };

      const res = await axios.post(
        `${API_BASE_URL}/api/sales`,
        payload
      );

      if (res.data.success) {
        alert("Bill Saved Successfully!");
        onPreview();
      }
    } catch (error) {
      console.error("Submit failed:", error);
      alert("Save failed. Check quantity or product.");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     🧾 UI
     ========================= */
  return (
    <div className="eway-form-page no-print">
      <div className="eway-form-card">
        <h2>📄 E-Way Bill Form</h2>

        {/* Bill Details */}
        <div className="eway-form-grid">
          <input
            type="number"
            value={data.billNo || ""}
            onChange={(e) => setData({ ...data, billNo: e.target.value })}
            placeholder="Bill No"
          />
          <input
            type="date"
            value={data.date || ""}
            onChange={(e) => setData({ ...data, date: e.target.value })}
          />
          <input
            placeholder="Vehicle No"
            value={data.vehicle?.vehicleNo || ""}
            onChange={(e) =>
              setData({
                ...data,
                vehicle: { ...data.vehicle, vehicleNo: e.target.value },
              })
            }
          />
        </div>

        {/* Customer */}
        <select value={data.to?.name || ""} onChange={handleSelectSupplier}>
          <option value="">Select Customer</option>
          {suppliers.map((s) => (
            <option key={s._id} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>

        {/* Goods */}
        <button onClick={handleAddItem}>+ Add Item</button>
        {data.goods.map((item, index) => (
          <div key={index} className="eway-form-grid">
            <select
              value={item.product}
              onChange={(e) => updateGoods(index, "product", e.target.value)}
            >
              <option value="">Select Product</option>
              {Object.keys(HSN_MASTER).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Qty"
              value={item.quantity}
              onChange={(e) => updateGoods(index, "quantity", e.target.value)}
            />
            <input
              type="number"
              placeholder="Rate"
              value={item.rate}
              onChange={(e) => updateGoods(index, "rate", e.target.value)}
            />
            <input
              type="number"
              placeholder="Tax %"
              value={item.taxRate}
              onChange={(e) => updateGoods(index, "taxRate", e.target.value)}
            />
            <button onClick={() => handleRemoveItem(index)}>✖</button>
          </div>
        ))}

        {/* Freight & Total */}
        <input
          type="number"
          placeholder="Freight"
          value={data.freight || ""}
          onChange={(e) => calculateTotal(data.goods, e.target.value)}
        />

        <strong>
          Grand Total ₹{toSafeNumber(data.taxSummary?.total).toLocaleString()}
        </strong>

        {/* <button
          onClick={handleFinalSubmit}
          disabled={loading}
          className="preview-btn"
        >
          {loading ? "Saving..." : "💾 Save & Preview"}
        </button> */}
      </div>
    </div>
  );
};

export default EWayBillForm;
