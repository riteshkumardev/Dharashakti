import Supplier from "../models/Supplier.js";
import Transaction from "../models/Transaction.js"; 
import mongoose from "mongoose";

/**
 * ✅ 1. Naya Supplier Register (With Automatic Opening Balance Entry)
 */
export const createSupplier = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { name, gstin, phone, address, previousBalance } = req.body;
    const openingBal = Number(previousBalance) || 0;

    // 1. Check existing GSTIN
    if (gstin) {
      const existing = await Supplier.findOne({ gstin }).session(session);
      if (existing) throw new Error("Supplier with this GSTIN already exists");
    }

    // 2. Create Supplier
    const [supplier] = await Supplier.create([{
      name,
      gstin,
      phone,
      address,
      previousBalance: openingBal,
      totalOwed: openingBal
    }], { session });

    // 3. ✅ LEDGER ENTRY: Opening balance ka record banana
    if (openingBal !== 0) {
      await Transaction.create([{
        partyId: supplier._id,
        type: 'OUT', 
        amount: openingBal,
        description: "Opening Balance (Account Setup)",
        remainingBalance: openingBal,
        date: new Date()
      }], { session });
    }

    await session.commitTransaction();
    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * ✅ 2. Get All Suppliers List
 */
export const getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: suppliers });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching suppliers" });
  }
};

/**
 * ✅ 3. Update Supplier (With Balance Adjustment Logic)
 */
export const updateSupplier = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const { name, address, phone, gstin, previousBalance, lastBillNo, lastBillDate } = req.body;

    const oldSupplier = await Supplier.findById(id).session(session);
    if (!oldSupplier) throw new Error("Supplier not found");

    const oldPrevBal = Number(oldSupplier.previousBalance) || 0;
    const newPrevBal = Number(previousBalance) || 0;
    const diff = newPrevBal - oldPrevBal;

    const updatedData = {
      name, address, phone, gstin,
      previousBalance: newPrevBal,
      lastBillNo, lastBillDate,
      totalOwed: newPrevBal + (oldSupplier.currentBillsTotal || 0)
    };

    const supplier = await Supplier.findByIdAndUpdate(id, updatedData, { new: true, session });

    // ✅ ADJUSTMENT ENTRY: Agar opening balance manually change kiya gaya hai
    if (diff !== 0) {
      await Transaction.create([{
        partyId: id,
        type: diff > 0 ? 'OUT' : 'IN',
        amount: Math.abs(diff),
        description: `Manual Adjustment: Opening Balance Update`,
        remainingBalance: supplier.totalOwed,
        date: new Date()
      }], { session });
    }

    await session.commitTransaction();
    res.status(200).json({ success: true, data: supplier });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * ✅ 4. Bill Balance Update (When E-Way Bill/Sale is created)
 */
export const updateSupplierBalance = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { supplierId, billAmount, billNo } = req.body;

    const supplier = await Supplier.findById(supplierId).session(session);
    if (!supplier) throw new Error("Supplier not found");

    const amount = Number(billAmount);
    const newTotal = (supplier.totalOwed || 0) + amount;

    supplier.currentBillsTotal = (supplier.currentBillsTotal || 0) + amount;
    supplier.totalOwed = newTotal;
    await supplier.save({ session });

    // ✅ TRANSACTION RECORD: Ledger mein entry save karna
    await Transaction.create([{
      partyId: supplier._id,
      type: 'OUT',
      amount: amount,
      description: `Purchase: Bill No ${billNo || 'N/A'}`,
      remainingBalance: newTotal,
      date: new Date()
    }], { session });

    await session.commitTransaction();
    res.status(200).json({ success: true, message: "Balance & Ledger Updated ✅" });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * ✅ 5. Delete Supplier (With Ledger Cleanup)
 */
export const deleteSupplier = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const supplierId = req.params.id;
    
    // 1. Delete Supplier
    await Supplier.findByIdAndDelete(supplierId).session(session);
    
    // 2. ✅ CLEANUP: Is supplier ke saare transactions bhi delete karein
    await Transaction.deleteMany({ partyId: supplierId }).session(session);

    await session.commitTransaction();
    res.status(200).json({ success: true, message: "Supplier and history removed" });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: "Delete failed" });
  } finally {
    session.endSession();
  }
};