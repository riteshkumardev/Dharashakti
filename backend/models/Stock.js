import mongoose from "mongoose";

const stockSchema = new mongoose.Schema({
  productName: { type: String, required: true, unique: true },
  totalQuantity: { type: Number, default: 0 },
  remarks: { type: String }
}, { timestamps: true });

export default mongoose.model("Stock", stockSchema);