import Purchase from "../models/Purchase.js";
import Stock from "../models/Stock.js";

// 1️⃣ ➕ Add New Purchase (खरीद जोड़ना और स्टॉक बढ़ाना)
export const addPurchase = async (req, res) => {
  try {
    const purchase = await Purchase.create(req.body);

    // 🔄 स्टॉक ऑटो-अपडेट: खरीद होने पर स्टॉक बढ़ाएं (+)
    await Stock.findOneAndUpdate(
      { productName: req.body.productName },
      { $inc: { totalQuantity: Number(req.body.quantity) } }, 
      { upsert: true, new: true }
    );

    res.status(201).json({ success: true, data: purchase });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 2️⃣ 📄 Get All Purchases (सभी खरीद रिकॉर्ड देखना)
export const getPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find().sort({ createdAt: -1 });
    res.json({ success: true, count: purchases.length, data: purchases });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3️⃣ 🛠️ Update Purchase (खरीद सुधारना और स्टॉक एडजस्ट करना)
export const updatePurchase = async (req, res) => {
  try {
    // पुरानी खरीद का डेटा प्राप्त करें ताकि अंतर निकाला जा सके
    const oldPurchase = await Purchase.findById(req.params.id);
    if (!oldPurchase) return res.status(404).json({ success: false, message: "Purchase not found" });

    const updatedPurchase = await Purchase.findByIdAndUpdate(req.params.id, req.body, { new: true });

    // 🔄 स्टॉक एडजस्टमेंट लॉजिक:
    // (नयी मात्रा - पुरानी मात्रा) = जितना स्टॉक में और जोड़ना या घटाना है
    const qtyDiff = Number(req.body.quantity) - Number(oldPurchase.quantity);
    
    await Stock.findOneAndUpdate(
      { productName: req.body.productName },
      { $inc: { totalQuantity: qtyDiff } }, 
      { upsert: true }
    );

    res.json({ success: true, data: updatedPurchase });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 4️⃣ ❌ Delete Purchase (खरीद हटाना और स्टॉक कम करना)
export const deletePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) return res.status(404).json({ success: false, message: "Purchase not found" });

    // 🔄 स्टॉक वापस घटाएं (-): क्योंकि खरीदी गई मात्रा अब उपलब्ध नहीं है
    await Stock.findOneAndUpdate(
      { productName: purchase.productName },
      { $inc: { totalQuantity: -Number(purchase.quantity) } }
    );

    await Purchase.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Purchase deleted and Stock adjusted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};