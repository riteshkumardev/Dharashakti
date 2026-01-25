import mongoose from "mongoose";
import Purchase from "../models/Purchase.js";
import Transaction from "../models/Transaction.js"; 
import Supplier from "../models/Supplier.js";      

/* =============================================
    ➕ ADD PURCHASE (With Atomic Transaction)
============================================= */
export const addPurchase = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const payload = req.body;
    const totalAmount = Number(payload.totalAmount || 0);
    const paidAmount = Number(payload.paidAmount || 0);

    // 1. Purchase record create karein session ke saath
    const [purchase] = await Purchase.create([{
      ...payload,
      quantity: Number(payload.quantity || 0),
      rate: Number(payload.rate || 0),
      totalAmount: totalAmount,
      paidAmount: paidAmount,
    }], { session });

    // 2. Supplier Find & Ledger Update
    const supplier = await Supplier.findOne({ 
      $or: [{ name: payload.supplierName }, { mobile: payload.mobile }] 
    }).session(session);

    if (supplier) {
      const initialBalance = Number(supplier.currentBalance || 0);
      const newBalanceAfterPurchase = initialBalance + totalAmount;

      const transactions = [];

      // A. Purchase Transaction (OUT - Udhaari Badhi)
      transactions.push({
        partyId: supplier._id,
        purchaseId: purchase._id, // Reference link tracking ke liye
        type: 'OUT', 
        amount: totalAmount,
        description: `Purchase: Bill No ${payload.billNo || 'N/A'} (${payload.productName || 'Goods'})`,
        remainingBalance: newBalanceAfterPurchase,
        paymentMethod: "Credit",
        date: payload.date || new Date()
      });

      let finalBalance = newBalanceAfterPurchase;

      // B. Payment Transaction (IN - Agar cash/bank se payment di)
      if (paidAmount > 0) {
        finalBalance = newBalanceAfterPurchase - paidAmount;
        transactions.push({
          partyId: supplier._id,
          purchaseId: purchase._id,
          type: 'IN', 
          amount: paidAmount,
          description: `Paid for Bill No ${payload.billNo || 'N/A'}`,
          remainingBalance: finalBalance,
          paymentMethod: payload.paymentMethod || "Cash/Bank",
          date: payload.date || new Date()
        });
      }

      await Transaction.insertMany(transactions, { session });
      supplier.currentBalance = finalBalance;
      await supplier.save({ session });
    }

    await session.commitTransaction();
    res.status(201).json({ success: true, message: "Purchase & Ledger updated ✅", data: purchase });

  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
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
    🛠 UPDATE PURCHASE (Linked with Ledger Adjustment)
============================================= */
export const updatePurchase = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const oldPurchase = await Purchase.findById(id).session(session);
    
    if (!oldPurchase) throw new Error("Record not found");

    // Supplier balance reverse karein naye update se pehle
    const supplier = await Supplier.findOne({ 
        $or: [{ name: oldPurchase.supplierName }, { mobile: oldPurchase.mobile }] 
    }).session(session);

    if (supplier) {
        supplier.currentBalance = (supplier.currentBalance || 0) - Number(oldPurchase.totalAmount) + Number(oldPurchase.paidAmount);
        await supplier.save({ session });
    }
    
    const updatedPurchase = await Purchase.findByIdAndUpdate(id, req.body, { new: true, session });

    // Naya balance apply karein
    if (supplier) {
        supplier.currentBalance = (supplier.currentBalance || 0) + Number(updatedPurchase.totalAmount) - Number(updatedPurchase.paidAmount);
        await supplier.save({ session });

        // Ledger Adjustment Entry
        await Transaction.create([{
            partyId: supplier._id,
            purchaseId: id,
            type: 'OUT',
            amount: 0,
            description: `Purchase Updated: Bill No ${updatedPurchase.billNo}`,
            remainingBalance: supplier.currentBalance,
            date: new Date()
        }], { session });
    }

    await session.commitTransaction();
    res.json({ success: true, message: "Purchase updated and balance adjusted ✅", data: updatedPurchase });

  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

/* =========================
    ❌ DELETE PURCHASE (Reverse Ledger Logic)
========================= */
export const deletePurchase = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const purchase = await Purchase.findById(id).session(session);

    if (!purchase) throw new Error("Record not found");

    // Reverse Supplier Balance
    const supplier = await Supplier.findOne({ 
        $or: [{ name: purchase.supplierName }, { mobile: purchase.mobile }] 
    }).session(session);

    if (supplier) {
        // Calculation: Purana Balance = Current - Bill Total + Paid Amount
        supplier.currentBalance = (supplier.currentBalance || 0) - Number(purchase.totalAmount) + Number(purchase.paidAmount);
        await supplier.save({ session });
    }

    // Delete related transactions
    await Transaction.deleteMany({ purchaseId: id }).session(session);
    await Purchase.findByIdAndDelete(id).session(session);

    await session.commitTransaction();
    res.json({ success: true, message: "Purchase deleted & Ledger reversed ✅" });

  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};