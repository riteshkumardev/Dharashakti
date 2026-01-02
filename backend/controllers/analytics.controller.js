import Sale from "../models/Sale.js";
import Purchase from "../models/Purchase.js";
import Expense from "../models/Expense.js";

export const getProfitLossData = async (req, res) => {
  try {
    // 1. Total Sales (Aggregation using totalPrice field)
    const sales = await Sale.aggregate([
      { $group: { _id: null, total: { $sum: "$totalPrice" } } }
    ]);

    // 2. Total Purchases (Aggregation using totalAmount field)
    const purchases = await Purchase.aggregate([
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    // 3. Total Expenses (Aggregation using amount field)
    const expenses = await Expense.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    res.status(200).json({
      success: true,
      totalSales: sales[0]?.total || 0,
      totalPurchases: purchases[0]?.total || 0,
      totalExpenses: expenses[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};