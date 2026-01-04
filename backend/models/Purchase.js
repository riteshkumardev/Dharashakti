import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema({
  date: { type: String, required: true },
  supplierName: { type: String, required: true },
  productName: { type: String, required: true },
  billNo: { type: String, required: false },
  vehicleNo: { type: String, required: false }, // 🆕 नया फील्ड: वाहन का नंबर
  quantity: { type: Number, required: true },
  rate: { type: Number, required: true },
   travelingCost: { type: Number, default: 0 }, 
  cashDiscount: { type: Number, default: 0 },   // 🆕 नया फील्ड: कैश डिस्काउंट (CD)
  totalAmount: { type: Number, required: true }, // (Qty * Rate) - CD
  paidAmount: { type: Number, default: 0 },
  balanceAmount: { type: Number, default: 0 },
  remarks: { type: String }
}, { timestamps: true });

export default mongoose.model("Purchase", purchaseSchema);