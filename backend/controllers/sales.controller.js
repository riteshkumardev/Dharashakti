import Sale from "../models/Sale.js";

/* =========================================
    🔒 Helper: Number Conversion
   ========================================= */
const toSafeNumber = (val) => {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
};

/* =========================================
    ✅ READ: Get Latest Bill Number
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
    1️⃣ CREATE: Add Sale (Independent)
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

    // Sirf Sale record create hoga, Stock deduction logic hata di gayi hai
    const sale = await Sale.create(sanitizedData);

    res.status(201).json({ 
      success: true, 
      message: "Sale recorded successfully (No stock adjustment)", 
      data: sale 
    });
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
    3️⃣ UPDATE: Update Sale Only
   ========================================= */
export const updateSale = async (req, res) => {
  try {
    const { id } = req.params;

    // Stock re-adjustment ka pura code yahan se remove kar diya gaya hai
    const updatedSale = await Sale.findByIdAndUpdate(id, req.body, { 
      new: true, 
      runValidators: true 
    });

    if (!updatedSale) {
      return res.status(404).json({ success: false, message: "Sale record nahi mila" });
    }

    res.json({ 
      success: true, 
      message: "Sale record updated independently", 
      data: updatedSale 
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* =========================================
    4️⃣ DELETE: Delete Sale Only
   ========================================= */
export const deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findByIdAndDelete(req.params.id);
    
    if (!sale) {
      return res.status(404).json({ success: false, message: "Sale nahi mili" });
    }

    // Restore Stock ka code yahan se hata diya gaya hai
    res.json({ success: true, message: "Sale record deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================================
    🧹 DATA CLEANUP: One-Time Data Migration
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