import Purchase from "../models/Purchase.js";
import Stock from "../models/Stock.js";

// ➕ Add Purchase and Update Stock

export const addPurchase = async (req, res) => {
  try {
    const purchase = await Purchase.create(req.body);

    const updatedStock = await Stock.findOneAndUpdate(
      { productName: req.body.productName },
      { $inc: { totalQuantity: req.body.quantity } },
      { upsert: true, new: true }
    );

    res.status(201).json({ 
      success: true, 
      message: "Purchase saved & Stock updated", 
      stock: updatedStock 
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
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