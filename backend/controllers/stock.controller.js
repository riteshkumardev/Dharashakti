import Purchase from "../models/Purchase.js";
import Stock from "../models/Stock.js";

// ➕ Add Purchase and Update Stock
export const addPurchase = async (req, res) => {
  try {
    const {
      date,
      supplierName,
      productName,
      billNo,
      vehicleNo,
      quantity = 0,
      rate = 0,
      travelingCost = 0,
      cashDiscount = 0,
      totalAmount = 0,
      paidAmount = 0,
      balanceAmount = 0,
      remarks
    } = req.body;

    const purchase = await Purchase.create({
      date,
      supplierName,
      productName,
      billNo,
      vehicleNo,
      quantity: Number(quantity),
      rate: Number(rate),
      travelingCost: Number(travelingCost),
      cashDiscount: Number(cashDiscount),
      totalAmount: Number(totalAmount),
      paidAmount: Number(paidAmount),
      balanceAmount: Number(balanceAmount),
      remarks
    });

    // 🔄 STOCK UPDATE
    const stock = await Stock.findOneAndUpdate(
      { productName },
      {
        $inc: { totalQuantity: purchase.quantity },
        $set: { updatedAt: new Date() }
      },
      { upsert: true, new: true }
    );

    res.status(201).json({
      success: true,
      message: "Purchase saved & Stock updated ✅",
      purchase,
      stock
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// 📄 Get Inventory (Stock Table ke liye)
export const getStocks = async (req, res) => {
  try {
    const stocks = await Stock.find().sort({ updatedAt: -1 });
    res.json({ success: true, data: stocks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🛠️ Update Stock Manually
export const updateStock = async (req, res) => {
  try {
    const stock = await Stock.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: stock });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ❌ Delete Stock
export const deleteStock = async (req, res) => {
  try {
    await Stock.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Deleted" });
  } catch (error) {
    res.status(404).json({ success: false, message: "Not found" });
  }
};