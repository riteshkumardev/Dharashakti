import Sale from "../models/Sale.js";
import Stock from "../models/Stock.js";

// ✅ 1. Latest Bill Number nikalne ka naya function (Auto-Increment logic)
export const getLatestBillNo = async (req, res) => {
  try {
    // Database se sabse bada billNo find karein (Numerical order mein)
    const lastSale = await Sale.findOne().sort({ billNo: -1 });
    
    // Agar image ke mutabiq 168 last hai, toh next 169 hoga
    const nextBillNo = lastSale && !isNaN(lastSale.billNo) 
      ? Number(lastSale.billNo) + 1 
      : 169; 

    res.json({ success: true, nextBillNo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ➕ Add new sale (Bill No aur Stock update ke saath)
export const addSale = async (req, res) => {
  try {
    // 1. Sale record create karein
    const sale = await Sale.create(req.body);

    // 2. 🔄 स्टॉक ऑटो-अपडेट: Multiple items hone par loop chalayein ya single item handle karein
    // Agar body mein products array hai toh loop chalega, warna single productName
    if (req.body.goods && Array.isArray(req.body.goods)) {
      for (const item of req.body.goods) {
        await Stock.findOneAndUpdate(
          { productName: item.product },
          { $inc: { totalQuantity: -Number(item.quantity) } },
          { upsert: true }
        );
      }
    } else {
      await Stock.findOneAndUpdate(
        { productName: req.body.productName },
        { $inc: { totalQuantity: -Number(req.body.quantity) } },
        { upsert: true }
      );
    }

    res.status(201).json({ success: true, data: sale });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 📄 Get all sales (Image_ab30e5 ke table ke liye)
export const getSales = async (req, res) => {
  try {
    // Latest bills ko sabse upar dikhane ke liye sort karein
    const sales = await Sale.find().sort({ billNo: -1 });
    res.json({ success: true, count: sales.length, data: sales });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🛠️ Update sale (Stock Balance Fix)
export const updateSale = async (req, res) => {
  try {
    const oldSale = await Sale.findById(req.params.id);
    if (!oldSale) return res.status(404).json({ success: false, message: "Sale not found" });

    const updatedSale = await Sale.findByIdAndUpdate(req.params.id, req.body, { new: true });

    // स्टॉक एडजस्टमेंट logic
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

// ✅ Delete Sale (Stock adjustment for multiple items)
export const deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ success: false, message: "Sale not found" });

    // 🔄 Loop chalakar har product ka stock wapas badhayein
    if (sale.goods && sale.goods.length > 0) {
      for (const item of sale.goods) {
        await Stock.findOneAndUpdate(
          { productName: item.product },
          { $inc: { totalQuantity: Number(item.quantity) } }
        );
      }
    }

    await Sale.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Sale deleted and Stock adjusted" });
  } catch (error) {
    // ⚠️ Agar yahan error 500 aa raha hai, toh check karein ki req.params.id sahi bhej raha hai frontend
    res.status(500).json({ success: false, message: error.message });
  }
};