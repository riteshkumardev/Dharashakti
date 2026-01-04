import Sale from "../models/Sale.js";
import Stock from "../models/Stock.js"; // 🆕 Stock मॉडल इम्पोर्ट करना न भूलें

// ➕ Add new sale (एंड स्टॉक घटाना)
export const addSale = async (req, res) => {
  try {
    const sale = await Sale.create(req.body);

    // 🔄 स्टॉक ऑटो-अपडेट: सेल होने पर स्टॉक कम करें (-)
    await Stock.findOneAndUpdate(
      { productName: req.body.productName },
      { $inc: { totalQuantity: -Number(req.body.quantity) } }, // Quantity को घटाएं
      { upsert: true, new: true } // अगर प्रोडक्ट नहीं है तो नया बना देगा
    );

    res.status(201).json({ success: true, data: sale });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 📄 Get all sales
export const getSales = async (req, res) => {
  try {
    const sales = await Sale.find().sort({ createdAt: -1 });
    res.json({ success: true, count: sales.length, data: sales });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🛠️ Update sale (पुराने और नए स्टॉक को बैलेंस करना)
export const updateSale = async (req, res) => {
  try {
    // 1. पुरानी सेल का डेटा निकालें ताकि स्टॉक बैलेंस किया जा सके
    const oldSale = await Sale.findById(req.params.id);
    if (!oldSale) return res.status(404).json({ success: false, message: "Sale not found" });

    const updatedSale = await Sale.findByIdAndUpdate(req.params.id, req.body, { new: true });

    // 2. स्टॉक एडजस्टमेंट: पुराने वजन को वापस जोड़ें और नए को घटाएं
    const qtyDiff = Number(oldSale.quantity) - Number(req.body.quantity);
    
    await Stock.findOneAndUpdate(
      { productName: req.body.productName },
      { $inc: { totalQuantity: qtyDiff } }, 
      { upsert: true }
    );

    res.json({ success: true, data: updatedSale });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ❌ Delete sale (स्टॉक वापस बढ़ाना)
export const deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ success: false, message: "Sale not found" });

    // 🔄 स्टॉक वापस बढ़ाएं (+): क्योंकि बिक्री कैंसिल हो गई है
    await Stock.findOneAndUpdate(
      { productName: sale.productName },
      { $inc: { totalQuantity: Number(sale.quantity) } }
    );

    await Sale.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Sale deleted and Stock adjusted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};