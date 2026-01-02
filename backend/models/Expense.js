import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
  date: { type: String, required: true },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  detail: { type: String },
  time: { type: String }
}, { timestamps: true });

export default mongoose.model("Expense", expenseSchema);