import Purchase from "../models/Purchase.js";
import Transaction from "../models/Transaction.js"; // ✅ New Import
import Supplier from "../models/Supplier.js";       // ✅ New Import

/* =============================================
    ➕ ADD PURCHASE (With Automatic Ledger Link)
============================================= */
export const addPurchase = async (req, res) => {
  try {
    const {
      date, supplierName, gstin, mobile, address, productName,
      billNo, vehicleNo, quantity = 0, rate = 0, travelingCost = 0,
      cashDiscount = 0, totalAmount = 0, paidAmount = 0, balanceAmount = 0, remarks
    } = req.body;

    // 1. Purchase record create karein
    const purchase = await Purchase.create({
      date, supplierName, gstin, mobile, address, productName,
      billNo, vehicleNo,
      quantity: Number(quantity),
      rate: Number(rate),
      travelingCost: Number(travelingCost),
      cashDiscount: Number(cashDiscount),
      totalAmount: Number(totalAmount),
      paidAmount: Number(paidAmount),
      balanceAmount: Number(balanceAmount),
      remarks
    });

    // 2. ✅ AUTOMATIC LEDGER LOGIC:
    // Supplier ko unke naam ya mobile se dhundein
    const supplier = await Supplier.findOne({ 
      $or: [{ name: supplierName }, { mobile: mobile }] 
    });

    if (supplier) {
      // Naya balance calculate karein (Total Bill Amount udhaari badhayega)
      const newBalance = Number(supplier.currentBalance || 0) + Number(totalAmount);

      // A. Transaction Entry (Maal khareedne ki entry)
      const purchaseTransaction = new Transaction({
        partyId: supplier._id,
        type: 'OUT', // Maal aaya matlab paisa dena banta hai
        amount: Number(totalAmount),
        description: `Purchase: Bill No ${billNo} (${productName})`,
        remainingBalance: newBalance,
        paymentMethod: "Credit"
      });
      await purchaseTransaction.save();

      // B. Agar kuch Cash Payment di hai, toh uski bhi entry karein
      if (Number(paidAmount) > 0) {
        const finalBalance = newBalance - Number(paidAmount);
        const paymentTransaction = new Transaction({
          partyId: supplier._id,
          type: 'IN', // Paisa diya toh udhaari kam hui
          amount: Number(paidAmount),
          description: `Paid for Bill No ${billNo}`,
          remainingBalance: finalBalance,
          paymentMethod: "Cash/Bank"
        });
        await paymentTransaction.save();
        
        // Supplier ka main balance update karein
        supplier.currentBalance = finalBalance;
      } else {
        supplier.currentBalance = newBalance;
      }

      await supplier.save();
    }

    res.status(201).json({
      success: true,
      message: "Purchase saved & Ledger updated successfully ✅",
      purchase
    });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
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
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =============================================
    🛠 UPDATE PURCHASE (Linked with Ledger)
============================================= */
export const updatePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const oldPurchase = await Purchase.findById(id);
    
    if (!oldPurchase)
      return res.status(404).json({ success: false, message: "Record not found" });

    // Note: Update logic mein ledger balance adjust karna complex hota hai. 
    // Isliye best practice hai ki aap purani entries ko 'Daily Cashbook' se manage karein.
    
    const updatedPurchase = await Purchase.findByIdAndUpdate(
      id,
      { ...req.body },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Purchase record updated ✅",
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

    res.json({
      success: true,
      message: "Purchase record deleted successfully ✅"
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};