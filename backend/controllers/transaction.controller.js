import Transaction from '../models/Transaction.js'; // .js extension zaroori hai
import Supplier from '../models/Supplier.js';

// 1. Naya Transaction add karne ka logic
export const addTransaction = async (req, res) => {
  const { partyId, amount, type, description, paymentMethod } = req.body;

  try {
    // Party/Supplier ko dhundein
    const party = await Supplier.findById(partyId);
    if (!party) {
      return res.status(404).json({ success: false, message: "Party nahi mili" });
    }

    // Naya Balance calculate karein (Bank statement logic)
    let newBalance = Number(party.currentBalance || 0);
    const transactionAmount = Number(amount);

    if (type === 'IN') {
      newBalance -= transactionAmount; // Payment aaya toh udhari kam hui
    } else if (type === 'OUT') {
      newBalance += transactionAmount; // Payment diya toh hisab badha
    }

    // A. Transaction record save karein (History/Passbook ke liye)
    const transaction = new Transaction({
      partyId,
      amount: transactionAmount,
      type,
      description,
      paymentMethod,
      remainingBalance: newBalance
    });
    await transaction.save();

    // B. Supplier table mein main balance update karein
    party.currentBalance = newBalance;
    await party.save();

    res.status(201).json({ 
      success: true, 
      message: "Transaction successful", 
      updatedBalance: newBalance 
    });
  } catch (error) {
    console.error("Transaction Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 2. Kisi bhi party ki puri history (Passbook) nikalne ke liye
export const getTransactionHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const history = await Transaction.find({ partyId: id }).sort({ date: -1 });
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};