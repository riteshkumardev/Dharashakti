import Expense from "../models/Expense.js";

// ➕ Add Transaction (Payment In/Out)
export const addExpense = async (req, res) => {
  try {
    // Current time add karna
    const time = new Date().toLocaleTimeString();
    
    // Frontend se partyName, type, amount, txnId, remark aayega
    const expense = await Expense.create({ 
      ...req.body, 
      time 
    });

    res.status(201).json({ 
      success: true, 
      message: "Transaction recorded successfully", 
      data: expense 
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

// 📄 Get Passbook Data & Balance Summary
export const getExpenses = async (req, res) => {
  try {
    // Sabhi transactions ko date ke hisaab se sort karna (Latest First)
    const transactions = await Expense.find().sort({ date: -1, createdAt: -1 });

    // Payment In (Aaya) ka Total
    const totalIn = await Expense.aggregate([
      { $match: { type: "Payment In" } },
      { $group: { _id: null, sum: { $sum: { $toDouble: "$amount" } } } }
    ]);

    // Payment Out (Gaya) ka Total
    const totalOut = await Expense.aggregate([
      { $match: { type: "Payment Out" } },
      { $group: { _id: null, sum: { $sum: { $toDouble: "$amount" } } } }
    ]);

    const sumIn = totalIn[0]?.sum || 0;
    const sumOut = totalOut[0]?.sum || 0;

    res.status(200).json({
      success: true,
      data: transactions,
      totalIn: sumIn,
      totalOut: sumOut,
      netBalance: sumIn - sumOut // Plus matlab Advance, Minus matlab Due
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Server Error" 
    });
  }
};