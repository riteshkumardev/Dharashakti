import mongoose from "mongoose";
import Sale from "../models/Sale.js";
import Transaction from "../models/Transaction.js"; 
import Supplier from "../models/Supplier.js";      

/* =========================================
    🔒 Helper: Number Conversion
   ========================================= */
const toSafeNumber = (val) => {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
};

/* =========================================
    ✅ READ: Get Latest Bill Number
   ========================================= */
export const getLatestBillNo = async (req, res) => {
  try {
    const lastSale = await Sale.findOne().sort({ billNo: -1 });
    const nextBillNo = lastSale && lastSale.billNo ? Number(lastSale.billNo) + 1 : 1;
    res.json({ success: true, nextBillNo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================================
    1️⃣ CREATE: Add Sale (Atomic Transaction)
   ========================================= */
export const addSale = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const payload = req.body;
    const totalAmount = toSafeNumber(payload.totalPrice || payload.totalAmount);
    const paidAmount = toSafeNumber(payload.paidAmount || payload.amountReceived); 

    // Mapping Frontend fields to Backend Schema
    const sanitizedData = {
      ...payload,
      freight: toSafeNumber(payload.travelingCost),
      buyerOrderDate: payload.orderDate || "-",
      dispatchDate: payload.deliveryNoteDate || "-",
      totalAmount: totalAmount,
    };

    // Sale create karein session ke saath
    const [sale] = await Sale.create([sanitizedData], { session });

    // Party dhundein (consigneeName ya customerName handle kiya gaya hai)
    const partyName = payload.consigneeName || payload.customerName;
    const party = await Supplier.findOne({ name: partyName }).session(session);

    if (party) {
      const initialBalance = toSafeNumber(party.totalOwed ?? party.currentBalance);
      const newBalanceAfterSale = initialBalance + totalAmount;

      const transactions = [];

      // A. Sale Record (OUT - Udhaari badhi)
      transactions.push({
        partyId: party._id,
        saleId: sale._id,
        type: 'OUT', 
        amount: totalAmount,
        description: `Sale: Bill No ${payload.billNo || 'N/A'}`,
        remainingBalance: newBalanceAfterSale,
        paymentMethod: "Credit",
        date: payload.date || new Date()
      });

      let finalBalance = newBalanceAfterSale;

      // B. Payment Record (IN - Agar paisa turant mila)
      if (paidAmount > 0) {
        finalBalance = newBalanceAfterSale - paidAmount;
        transactions.push({
          partyId: party._id,
          saleId: sale._id,
          type: 'IN', 
          amount: paidAmount,
          description: `Payment: Bill No ${payload.billNo || 'N/A'}`,
          remainingBalance: finalBalance,
          paymentMethod: payload.paymentMethod || "Cash",
          date: payload.date || new Date()
        });
      }

      // Batch save transactions
      await Transaction.insertMany(transactions, { session });
      
      // Update Party Main Balance
      party.totalOwed = finalBalance;
      party.currentBalance = finalBalance;
      await party.save({ session });
    }

    await session.commitTransaction();
    res.status(201).json({ success: true, message: "Sale & Ledger updated successfully ✅", data: sale });

  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

/* =========================================
    2️⃣ UPDATE: updateSale (Fix for SyntaxError)
   ========================================= */
export const updateSale = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const oldSale = await Sale.findById(id).session(session);
    if (!oldSale) throw new Error("Sale record nahi mila");

    // 1. Purana balance reverse karein
    const partyName = oldSale.consigneeName || oldSale.customerName;
    const party = await Supplier.findOne({ name: partyName }).session(session);
    if (party) {
        const oldTotal = toSafeNumber(oldSale.totalAmount);
        const oldPaid = toSafeNumber(oldSale.paidAmount || oldSale.amountReceived);
        party.totalOwed = (party.totalOwed || 0) - oldTotal + oldPaid;
        await party.save({ session });
    }

    // 2. Naya data update karein
    const updatedSale = await Sale.findByIdAndUpdate(id, req.body, { new: true, session });
    
    // 3. Naya balance apply karein aur adjustment entry dalo
    if (party) {
        const newTotal = toSafeNumber(updatedSale.totalAmount || updatedSale.totalPrice);
        const newPaid = toSafeNumber(updatedSale.paidAmount || updatedSale.amountReceived);
        party.totalOwed = (party.totalOwed || 0) + newTotal - newPaid;
        party.currentBalance = party.totalOwed;
        await party.save({ session });
        
        // Ledger entry (Adjustment)
        await Transaction.create([{
            partyId: party._id,
            saleId: id,
            type: 'OUT',
            amount: 0,
            description: `Sale Updated: Bill No ${updatedSale.billNo}`,
            remainingBalance: party.totalOwed,
            date: new Date()
        }], { session });
    }

    await session.commitTransaction();
    res.json({ success: true, message: "Sale & Ledger updated ✅", data: updatedSale });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

/* =========================================
    3️⃣ DELETE: Delete Sale (Reverse Ledger)
   ========================================= */
export const deleteSale = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const sale = await Sale.findById(id).session(session);

    if (!sale) throw new Error("Sale record nahi mila");

    // 1. Party balance reverse karein
    const partyName = sale.consigneeName || sale.customerName;
    const party = await Supplier.findOne({ name: partyName }).session(session);
    if (party) {
        const totalAmt = toSafeNumber(sale.totalAmount);
        const paidAmt = toSafeNumber(sale.paidAmount || sale.amountReceived);
        
        party.totalOwed = (party.totalOwed || 0) - totalAmt + paidAmt;
        party.currentBalance = party.totalOwed;
        await party.save({ session });
    }

    // 2. Jude huye Transactions delete karein
    await Transaction.deleteMany({ saleId: id }).session(session);
    
    // 3. Sale delete karein
    await Sale.findByIdAndDelete(id).session(session);

    await session.commitTransaction();
    res.json({ success: true, message: "Sale deleted and Balance adjusted ✅" });

  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

/* =========================================
    4️⃣ READ: Get All Sales
   ========================================= */
export const getSales = async (req, res) => {
  try {
    const sales = await Sale.find().sort({ createdAt: -1 });
    res.json({ success: true, count: sales.length, data: sales });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================================
    🧹 5️⃣ DATA CLEANUP
   ========================================= */
export const migrateSalesData = async (req, res) => {
  try {
    const result = await Sale.updateMany(
      { $or: [{ totalAmount: { $exists: false } }, { totalAmount: 0 }] },
      [{ $set: { totalAmount: "$totalPrice" } }]
    );
    res.json({ success: true, message: `${result.modifiedCount} records fixed successfully ✅` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};