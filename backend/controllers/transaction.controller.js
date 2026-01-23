import Transaction from '../models/Transaction.js';
import Supplier from '../models/Supplier.js';
import mongoose from 'mongoose';

export const addTransaction = async (req, res) => {
  const { partyId, amount, type, description, paymentMethod } = req.body;

  try {
    // 1. Robust Search: MongoDB Atlas mein IDs string ya ObjectId dono ho sakti hain
    // findOne ka upyog karna findById se zyada safe hai string IDs ke liye
    let party = await Supplier.findOne({ _id: partyId });

    if (!party) {
      console.log("Party not found in DB for ID:", partyId); // Debugging ke liye
      return res.status(404).json({ success: false, message: "Party database mein nahi mili" });
    }

    // 2. Balance Fetching (Multi-field Fallback)
    // Aapke DB mein balance 'totalOwed' ya 'currentBillsTotal' mein hai
    let currentBal = party.totalOwed ?? party.currentBillsTotal ?? party.currentBalance ?? 0;
    
    let newBalance = Number(currentBal);
    const amt = Number(amount);

    // 3. Calculation Logic
    // IN (Payment Received) -> Party ki udhaari kam hogi (-=)
    // OUT (Payment Given) -> Party ka hisab/udhaari badhegi (+=)
    if (type === 'IN') {
      newBalance -= amt;
    } else {
      newBalance += amt;
    }

    // 4. Save Transaction Entry (Passbook/History ke liye)
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

    // 5. Update Supplier (Sahi fields ko sync karein)
    // Hum teeno possible fields ko update kar rahe hain taaki dashboard par sahi dikhe
    party.totalOwed = newBalance;
    party.currentBillsTotal = newBalance;
    
    // Check if currentBalance exists in Schema before updating
    if (party.currentBalance !== undefined || party.toObject().hasOwnProperty('currentBalance')) {
      party.currentBalance = newBalance;
    }
    
    await party.save();

    // Success Response: Naya balance frontend ko bhejein
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