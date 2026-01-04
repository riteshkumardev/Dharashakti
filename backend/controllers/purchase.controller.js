import Purchase from "../models/Purchase.js";
import Stock from "../models/Stock.js";

// 1️⃣ ➕ Add New Purchase
export const addPurchase = async (req, res) => {
  try {
    // सारी फ़ील्ड्स को एक साथ प्रोसेस करना
    const { 
      date, supplierName, productName, billNo, vehicleNo, 
      quantity, rate, travelingCost, cashDiscount, 
      totalAmount, paidAmount, balanceAmount, remarks 
    } = req.body;

    const purchaseData = {
      date, supplierName, productName, billNo, vehicleNo,
      quantity: Number(quantity) || 0,
      rate: Number(rate) || 0,
      travelingCost: Number(travelingCost) || 0,
      cashDiscount: Number(cashDiscount) || 0,
      paidAmount: Number(paidAmount) || 0,
      totalAmount: Number(totalAmount) || 0,
      balanceAmount: Number(balanceAmount) || 0,
      remarks
    };

    const purchase = await Purchase.create(purchaseData);

    // 🔄 स्टॉक अपडेट
    const updatedStock = await Stock.findOneAndUpdate(
      { productName: purchase.productName },
      { 
        $inc: { totalQuantity: purchase.quantity },
        $set: { updatedAt: new Date() } 
      }, 
      { upsert: true, new: true }
    );

    res.status(201).json({ 
      success: true, 
      message: "Purchase saved & Stock updated! ✅", 
      data: purchase, // यहाँ अब सारी फ़ील्ड्स वापस आएँगी
      stock: updatedStock 
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 2️⃣ 📄 Get All Purchases
export const getPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find().sort({ createdAt: -1 });
    res.json({ success: true, count: purchases.length, data: purchases });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3️⃣ 🛠️ Update Purchase
export const updatePurchase = async (req, res) => {
  try {
    const oldPurchase = await Purchase.findById(req.params.id);
    if (!oldPurchase) return res.status(404).json({ success: false, message: "Record not found" });

    // नई वैल्यूज को नंबर्स में बदलना
    const updateBody = {
      ...req.body,
      quantity: Number(req.body.quantity),
      rate: Number(req.body.rate),
      travelingCost: Number(req.body.travelingCost),
      cashDiscount: Number(req.body.cashDiscount),
      paidAmount: Number(req.body.paidAmount),
      totalAmount: Number(req.body.totalAmount),
      balanceAmount: Number(req.body.balanceAmount),
    };

    const updatedPurchase = await Purchase.findByIdAndUpdate(req.params.id, updateBody, { new: true });

    // 🔄 स्टॉक एडजस्टमेंट
    const qtyDiff = Number(updateBody.quantity) - Number(oldPurchase.quantity);
    
    const updatedStock = await Stock.findOneAndUpdate(
      { productName: updateBody.productName },
      { $inc: { totalQuantity: qtyDiff } }, 
      { upsert: true, new: true }
    );

    res.json({ success: true, data: updatedPurchase, stock: updatedStock });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 4️⃣ ❌ Delete Purchase
export const deletePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) return res.status(404).json({ success: false, message: "Record not found" });

    // 🔄 स्टॉक वापस कम करें
    const updatedStock = await Stock.findOneAndUpdate(
      { productName: purchase.productName },
      { $inc: { totalQuantity: -Number(purchase.quantity) } },
      { new: true }
    );
    await Purchase.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Purchase deleted and Stock adjusted", stock: updatedStock });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};