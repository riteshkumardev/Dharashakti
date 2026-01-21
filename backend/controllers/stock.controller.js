import Stock from "../models/Stock.js";

/**
 * ➕ CREATE/ADD STOCK (Independent)
 * Ye function kisi bhi purchase record se link nahi hai.
 * Ye seedha stock table mein naya item add karega ya existing ko update karega.
 */
export const addStockItem = async (req, res) => {
  try {
    const { productName, totalQuantity, remarks } = req.body;

    if (!productName) {
      return res.status(400).json({ success: false, message: "Product Name is required" });
    }

    // Independent logic: Direct overwrite ya naya create (Manual Entry)
    const stock = await Stock.findOneAndUpdate(
      { productName: productName.toUpperCase().trim() },
      { 
        $set: { 
          productName: productName.toUpperCase().trim(),
          totalQuantity: Number(totalQuantity) || 0, 
          remarks: remarks || "Manual Entry",
          updatedAt: new Date()
        } 
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(201).json({
      success: true,
      message: "Stock item added/updated successfully ✅",
      data: stock
    });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * 📄 GET ALL STOCKS
 * Table mein dikhane ke liye saara data fetch karega.
 */
export const getStocks = async (req, res) => {
  try {
    const stocks = await Stock.find().sort({ productName: 1 });
    res.json({ success: true, data: stocks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 🛠️ UPDATE STOCK MANUALLY
 * Table mein inline edit karne ke liye.
 */
export const updateStock = async (req, res) => {
  try {
    const { productName, totalQuantity, remarks } = req.body;
    
    const stock = await Stock.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { 
          productName: productName?.toUpperCase().trim(),
          totalQuantity: Number(totalQuantity), 
          remarks: remarks,
          updatedAt: new Date()
        } 
      },
      { new: true, runValidators: true }
    );

    res.json({ 
      success: true, 
      message: "Stock updated independently successfully", 
      data: stock 
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * ❌ DELETE STOCK
 * Database se item hatane ke liye.
 */
export const deleteStock = async (req, res) => {
  try {
    await Stock.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Stock item deleted from database" });
  } catch (error) {
    res.status(404).json({ success: false, message: "Item not found" });
  }
};