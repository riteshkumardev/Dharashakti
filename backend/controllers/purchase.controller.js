import Purchase from "../models/Purchase.js";
import Stock from "../models/Stock.js";

// 1️⃣ ➕ Add New Purchase (नयी खरीद और स्टॉक सिंक)
export const addPurchase = async (req, res) => {
  try {
    // डेटा को Number में सुरक्षित रूप से बदलें
    const purchaseData = {
      ...req.body,
      quantity: Number(req.body.quantity) || 0,
      rate: Number(req.body.rate) || 0,
      travelingCost: Number(req.body.travelingCost) || 0,
      cashDiscount: Number(req.body.cashDiscount) || 0,
      paidAmount: Number(req.body.paidAmount) || 0,
      totalAmount: Number(req.body.totalAmount) || 0,
      balanceAmount: Number(req.body.balanceAmount) || 0,
    };

    const purchase = await Purchase.create(purchaseData);

    // 🔄 स्टॉक ऑटो-अपडेट: खरीद होने पर स्टॉक बढ़ाएं (+)
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
      data: purchase, 
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

// 3️⃣ 🛠️ Update Purchase (एडिट लॉजिक)
export const updatePurchase = async (req, res) => {
  try {
    const oldPurchase = await Purchase.findById(req.params.id);
    if (!oldPurchase) return res.status(404).json({ success: false, message: "Not found" });

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

    // 🔄 स्टॉक एडजस्टमेंट: (नयी मात्रा - पुरानी मात्रा)
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
    if (!purchase) return res.status(404).json({ success: false, message: "Not found" });

    // 🔄 स्टॉक वापस घटाएं (-): क्योंकि खरीद डिलीट हो गई है
    const updatedStock = await Stock.findOneAndUpdate(
      { productName: purchase.productName },
      { $inc: { totalQuantity: -Number(purchase.quantity) } },
      { new: true }
    );

    await Purchase.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Deleted & Stock reverted", stock: updatedStock });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};