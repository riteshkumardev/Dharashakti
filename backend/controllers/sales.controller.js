import Sale from "../models/Sale.js";
import Stock from "../models/Stock.js";

/* =========================================
   🔒 Helper: Number Conversion
   ========================================= */
const toSafeNumber = (val) => {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
};

/* =========================================
   ✅ NEW: Get Latest Bill Number
   ========================================= */
export const getLatestBillNo = async (req, res) => {
  try {
    const lastSale = await Sale.findOne().sort({ billNo: -1 });
    const nextBillNo = lastSale && lastSale.billNo ? Number(lastSale.billNo) + 1 : 1;
    res.json({ success: true, nextBillNo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================================
   1️⃣ CREATE: Add Sale + Stock Deduction
   ========================================= */
export const addSale = async (req, res) => {
  try {
    const payload = req.body;

    // Mapping Frontend fields to Backend Schema
    const sanitizedData = {
      ...payload,
      freight: toSafeNumber(payload.travelingCost),
      buyerOrderDate: payload.orderDate || "-",
      dispatchDate: payload.deliveryNoteDate || "-",
      totalAmount: toSafeNumber(payload.totalPrice),
    };

    const sale = await Sale.create(sanitizedData);

    // Stock Adjustment
    const items = (sale.goods && sale.goods.length > 0) 
      ? sale.goods 
      : [{ product: sale.productName, quantity: sale.quantity }];

    for (const item of items) {
      if (item.product && item.quantity > 0) {
        await Stock.findOneAndUpdate(
          { productName: item.product },
          { $inc: { totalQuantity: -Number(item.quantity) } },
          { upsert: true }
        );
      }
    }

    res.status(201).json({ success: true, data: sale });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* =========================================
   2️⃣ READ: Get All Sales
   ========================================= */
export const getSales = async (req, res) => {
  try {
    const sales = await Sale.find().sort({ createdAt: -1 });
    res.json({ success: true, count: sales.length, data: sales });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================================
   3️⃣ UPDATE: Update Sale + Stock Re-adjustment
   ========================================= */
export const updateSale = async (req, res) => {
  try {
    const { id } = req.params;
    const oldSale = await Sale.findById(id);

    if (!oldSale) {
      return res.status(404).json({ success: false, message: "Sale record nahi mila" });
    }

    // Step A: Revert Old Stock
    const oldItems = (Array.isArray(oldSale.goods) && oldSale.goods.length > 0) 
      ? oldSale.goods 
      : [{ product: oldSale.productName, quantity: oldSale.quantity }];

    for (const item of oldItems) {
      const pName = item.product || item.productName;
      if (pName) {
        await Stock.findOneAndUpdate(
          { productName: pName },
          { $inc: { totalQuantity: toSafeNumber(item.quantity) } }
        );
      }
    }

    // Step B: Save New Data
    const updatedSale = await Sale.findByIdAndUpdate(id, req.body, { new: true });

    // Step C: Deduct New Stock
    const newItems = (Array.isArray(req.body.goods) && req.body.goods.length > 0) 
      ? req.body.goods 
      : [{ product: req.body.productName, quantity: req.body.quantity }];

    for (const item of newItems) {
      const pName = item.product || item.productName;
      const q = toSafeNumber(item.quantity);
      if (pName && q !== 0) {
        await Stock.findOneAndUpdate(
          { productName: pName },
          { $inc: { totalQuantity: -q } },
          { upsert: true }
        );
      }
    }

    res.json({ success: true, data: updatedSale });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* =========================================
   4️⃣ DELETE: Delete Sale + Restore Stock
   ========================================= */
export const deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ success: false, message: "Sale nahi mili" });

    // Restore Stock
    const itemsToReturn = (Array.isArray(sale.goods) && sale.goods.length > 0) 
      ? sale.goods 
      : [{ product: sale.productName, quantity: sale.quantity }];

    for (const item of itemsToReturn) {
      const pName = item.product || item.productName;
      if (pName) {
        await Stock.findOneAndUpdate(
          { productName: pName },
          { $inc: { totalQuantity: toSafeNumber(item.quantity) } }
        );
      }
    }

    await Sale.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Sale deleted aur stock restore ho gaya" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================================
   🧹 NEW: One-Time Data Migration
   ========================================= */
export const migrateSalesData = async (req, res) => {
  try {
    const sales = await Sale.find({});
    let updateCount = 0;

    for (const sale of sales) {
      const updateData = {};
      let needsUpdate = false;

      if (sale.totalPrice !== undefined && sale.totalAmount === 0) {
        updateData.totalAmount = sale.totalPrice;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await Sale.findByIdAndUpdate(sale._id, { $set: updateData });
        updateCount++;
      }
    }

    res.json({ success: true, message: `${updateCount} records fixed successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};