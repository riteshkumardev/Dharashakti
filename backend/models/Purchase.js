import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema({
  date: { type: String, required: true },
  supplierName: { type: String, required: true },
  productName: { type: String, required: true },
  billNo: { type: String, required: true },
  quantity: { type: Number, required: true },
  rate: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  balanceAmount: { type: Number, default: 0 },
  remarks: { type: String }
}, { timestamps: true });

export default mongoose.model("Purchase", purchaseSchema);