import Purchase from "../models/Purchase.js";

/* =============================================
    ➕ ADD PURCHASE (Independent)
============================================= */
export const addPurchase = async (req, res) => {
  try {
    const {
      date,
      supplierName,
      gstin,      
      mobile,     
      address,    
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

    // Sirf Purchase record create hoga, Stock logic hata di gayi hai
    const purchase = await Purchase.create({
      date,
      supplierName,
      gstin,      
      mobile,     
      address,    
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

    res.status(201).json({
      success: true,
      message: "Purchase saved successfully (No stock adjustment) ✅",
      purchase
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

/* =============================================
    🛠 UPDATE PURCHASE (Independent)
============================================= */
export const updatePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const oldPurchase = await Purchase.findById(id);
    
    if (!oldPurchase)
      return res.status(404).json({ success: false, message: "Record not found" });

    // Stock re-adjustment ka pura logic yahan se remove kar diya gaya hai
    const updatedFields = {
      ...req.body,
      quantity: Number(req.body.quantity ?? oldPurchase.quantity),
      rate: Number(req.body.rate ?? oldPurchase.rate),
      travelingCost: Number(req.body.travelingCost ?? oldPurchase.travelingCost),
      cashDiscount: Number(req.body.cashDiscount ?? oldPurchase.cashDiscount),
      paidAmount: Number(req.body.paidAmount ?? oldPurchase.paidAmount),
      totalAmount: Number(req.body.totalAmount ?? oldPurchase.totalAmount),
      balanceAmount: Number(req.body.balanceAmount ?? oldPurchase.balanceAmount) 
    };

    const updatedPurchase = await Purchase.findByIdAndUpdate(
      id,
      updatedFields,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Purchase record updated independently ✅",
      data: updatedPurchase
    });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* =========================
    ❌ DELETE PURCHASE
========================= */
export const deletePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findByIdAndDelete(req.params.id);

    if (!purchase)
      return res.status(404).json({ success: false, message: "Record not found" });

    // Stock rollback logic hata di gayi hai
    res.json({
      success: true,
      message: "Purchase record deleted successfully ✅"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};