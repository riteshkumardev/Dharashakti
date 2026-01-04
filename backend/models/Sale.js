import mongoose from "mongoose";

const saleSchema = new mongoose.Schema(
  {
    si: { type: Number, required: true },
    date: { type: String, required: true },
    customerName: { type: String, required: true },
    productName: { type: String, required: true },
    billNo: { type: String, required: true },
    quantity: { type: Number, required: true },
    rate: { type: Number, required: true },
    // 🆕 यहाँ हमने travelingCost जोड़ दिया है
    travelingCost: { type: Number, default: 0 }, 
    totalPrice: { type: Number, required: true },
    amountReceived: { type: Number, default: 0 },
    paymentDue: { type: Number, default: 0 },
    billDueDate: { type: String },
    remarks: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model("Sale", saleSchema);