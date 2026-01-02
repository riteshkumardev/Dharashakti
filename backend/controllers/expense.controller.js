import Expense from "../models/Expense.js";

// ➕ Add Expense
export const addExpense = async (req, res) => {
  try {
    const time = new Date().toLocaleTimeString();
    const expense = await Expense.create({ ...req.body, time });
    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 📄 Get All Expenses & Grand Total
export const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    
    // Aggregation for Grand Total
    const total = await Expense.aggregate([
      { $group: { _id: null, totalSum: { $sum: "$amount" } } }
    ]);

    res.status(200).json({ 
      success: true, 
      data: expenses, 
      totalSum: total[0]?.totalSum || 0 
    });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};