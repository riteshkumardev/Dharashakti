import Transaction from '../models/Transaction.js';
import Supplier from '../models/Supplier.js';
import Sale from '../models/Sale.js';
import Purchase from '../models/Purchase.js';
import mongoose from 'mongoose';

/**
 * ✅ CREATE: Smart Transaction with Precise Sync
 * Supplier Balance, Ledger, aur Sales/Purchases teeno ko sync karta hai.
 */
export const addTransaction = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction(); 

  try {
    const { partyId, amount, type, description, paymentMethod, linkTo } = req.body;
    const transactionAmount = Number(amount);

    if (!partyId || transactionAmount <= 0) {
      throw new Error("Invalid Party ID or Amount");
    }

    // 1. Party Fetch (Session ke saath)
    const party = await Supplier.findById(partyId).session(session);
    if (!party) throw new Error("Party database mein nahi mili");

    // 2. Precise Balance Calculation
    const currentBalance = Number(party.totalOwed || party.currentBalance || 0);
    const newBalance = type === 'IN' ? currentBalance - transactionAmount : currentBalance + transactionAmount;

    // 3. Create Ledger Entry
    await Transaction.create([{
      partyId: party._id,
      amount: transactionAmount,
      type,
      description: description || `Manual Entry (${linkTo || 'General'})`,
      paymentMethod: paymentMethod || "Cash",
      remainingBalance: newBalance,
      date: new Date()
    }], { session });

    // 4. ✅ MASTER SYNC: Aapke provided JSON data fields ke mutabiq
    
    // A. SALE TABLE SYNC (customerName match hona chahiye)
    if (linkTo === 'sale' && type === 'IN') {
      const latestSale = await Sale.findOne({ 
        customerName: party.name, 
        $expr: { $gt: ["$totalAmount", "$amountReceived"] } 
      }).sort({ createdAt: -1 }).session(session);

      if (latestSale) {
        latestSale.amountReceived = (Number(latestSale.amountReceived) || 0) + transactionAmount;
        // recalculation middleware (pre-save hook) ke liye automated logic
        latestSale.paymentDue = Number(latestSale.totalAmount) - latestSale.amountReceived;
        await latestSale.save({ session });
      }
    } 
    // B. PURCHASE TABLE SYNC (supplierName match hona chahiye)
    else if (linkTo === 'purchase' && type === 'OUT') {
      const latestPurchase = await Purchase.findOne({ 
        supplierName: party.name, 
        $expr: { $gt: ["$totalAmount", "$paidAmount"] }
      }).sort({ createdAt: -1 }).session(session);

      if (latestPurchase) {
        latestPurchase.paidAmount = (Number(latestPurchase.paidAmount) || 0) + transactionAmount;
        latestPurchase.balanceAmount = Number(latestPurchase.totalAmount) - latestPurchase.paidAmount;
        await latestPurchase.save({ session });
      }
    }

    // 5. Supplier Master Balance Update
    party.totalOwed = newBalance;
    party.currentBalance = newBalance;
    if (party.currentBillsTotal !== undefined) party.currentBillsTotal = newBalance;
    
    await party.save({ session });

    await session.commitTransaction();
    res.status(201).json({ 
      success: true, 
      message: `Transaction saved and ${linkTo} updated ✅`,
      updatedBalance: newBalance 
    });

  } catch (error) {
    await session.abortTransaction();
    console.error("Smart Sync Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

/**
 * ✅ READ: Get Transaction History
 */
export const getTransactionHistory = async (req, res) => {
  try {
    const { id } = req.params; 
    const history = await Transaction.find({ partyId: id }).sort({ date: -1 });
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ success: false, message: "History load nahi ho saki" });
  }
};