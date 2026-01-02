import mongoose from "mongoose";

const saleSchema = new mongoose.Schema(
  {
    customer: { type: String, required: true },
    billNo: { type: String, required: true },
    quantity: { type: Number, required: true },
    rate: { type: Number, required: true },
    total: { type: Number, required: true },
    received: { type: Number, default: 0 },
    due: { type: Number, default: 0 },
    date: { type: Date, default: Date.now },
    remarks: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model("Sale", saleSchema);
