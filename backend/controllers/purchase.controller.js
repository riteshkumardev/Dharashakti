import Purchase from "../models/Purchase.js";
import Stock from "../models/Stock.js";

/* =========================
   ➕ ADD PURCHASE
========================= */
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

/* =========================
   📄 GET ALL PURCHASES
========================= */
export const getPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: purchases.length,
      data: purchases
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* =========================
   🛠 UPDATE PURCHASE
========================= */
export const updatePurchase = async (req, res) => {
  try {
    const oldPurchase = await Purchase.findById(req.params.id);
    if (!oldPurchase)
      return res.status(404).json({ success: false, message: "Record not found" });

    const {
      productName,
      quantity = oldPurchase.quantity
    } = req.body;

    const updatedPurchase = await Purchase.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        quantity: Number(quantity),
        rate: Number(req.body.rate),
        travelingCost: Number(req.body.travelingCost),
        cashDiscount: Number(req.body.cashDiscount),
        paidAmount: Number(req.body.paidAmount),
        totalAmount: Number(req.body.totalAmount),
        balanceAmount: Number(req.body.balanceAmount)
      },
      { new: true }
    );

    /* 🔁 STOCK ADJUSTMENT LOGIC */
    // 1️⃣ old product quantity minus
    await Stock.findOneAndUpdate(
      { productName: oldPurchase.productName },
      { $inc: { totalQuantity: -oldPurchase.quantity } }
    );

    // 2️⃣ new product quantity add
    const stock = await Stock.findOneAndUpdate(
      { productName },
      { $inc: { totalQuantity: updatedPurchase.quantity } },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      purchase: updatedPurchase,
      stock
    });

  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/* =========================
   ❌ DELETE PURCHASE
========================= */
export const deletePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase)
      return res.status(404).json({ success: false, message: "Record not found" });

    // 🔻 STOCK ROLLBACK
    const stock = await Stock.findOneAndUpdate(
      { productName: purchase.productName },
      { $inc: { totalQuantity: -purchase.quantity } },
      { new: true }
    );

    await Purchase.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Purchase deleted & Stock adjusted ✅",
      stock
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
