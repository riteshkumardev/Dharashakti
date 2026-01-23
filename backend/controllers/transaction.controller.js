import Transaction from '../models/Transaction.js';
import Supplier from '../models/Supplier.js';
import mongoose from 'mongoose';

/* =============================================
    1️⃣ CREATE: Add New Transaction
   ============================================= */
export const addTransaction = async (req, res) => {
  const { partyId, amount, type, description, paymentMethod } = req.body;

  try {
    // 1. Party ko dhoondein (Direct ID search)
    let party = await Supplier.findOne({ _id: partyId });

    if (!party) {
      console.log("Party not found in DB for ID:", partyId);
      return res.status(404).json({ success: false, message: "Party database mein nahi mili" });
    }

    // 2. Balance Fetching (Aapke DB fields ke mutabiq)
    let currentBal = party.totalOwed ?? party.currentBillsTotal ?? party.currentBalance ?? 0;
    
    let newBalance = Number(currentBal);
    const amt = Number(amount);

    // 3. Logic: IN (Payment Received) -> Udhaari Kam | OUT (Payment Given) -> Udhaari Badhi
    if (type === 'IN') {
      newBalance -= amt;
    } else {
      newBalance += amt;
    }

    // 4. Save Transaction Entry (Passbook history ke liye)
    const transaction = new Transaction({
      partyId: party._id,
      amount: amt,
      type,
      description: description || "Manual Ledger Entry",
      paymentMethod: paymentMethod || "Cash",
      remainingBalance: newBalance,
      date: new Date()
    });
    await transaction.save();

    // 5. Update Supplier (Syncing all balance fields)
    party.totalOwed = newBalance;
    party.currentBillsTotal = newBalance;
    
    if (party.currentBalance !== undefined || party.toObject().hasOwnProperty('currentBalance')) {
      party.currentBalance = newBalance;
    }
    
    await party.save();

    res.status(201).json({ 
      success: true, 
      message: "Transaction Successful",
      updatedBalance: newBalance 
    });

  } catch (error) {
    console.error("Ledger Update Error:", error.message);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

/* =============================================
    2️⃣ READ: Get Transaction History (Missing Function)
   ============================================= */
export const getTransactionHistory = async (req, res) => {
  try {
    const { id } = req.params; // Route se Party ID lein

    // Party-wise saari history nikalna
    const history = await Transaction.find({ partyId: id }).sort({ date: -1 });

    res.status(200).json(history);
  } catch (error) {
    console.error("History Fetch Error:", error.message);
    res.status(500).json({ success: false, message: "History load nahi ho saki", error: error.message });
  }
};