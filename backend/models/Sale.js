import mongoose from "mongoose";

const saleSchema = new mongoose.Schema(
  {
    si: { type: Number, required: true },
    date: { type: String, required: true },
    customerName: { type: String, required: true },
    productName: { type: String, required: true },
    billNo: { type: String, required: false },
    vehicleNo: { type: String, required: false }, // 🆕 नया फील्ड: माल ले जाने वाली गाड़ी का नंबर
    quantity: { type: Number, required: true },
    rate: { type: Number, required: true },
    travelingCost: { type: Number, default: 0 }, 
    cashDiscount: { type: Number, default: 0 },
    totalPrice: { type: Number, default: 0 },
    amountReceived: { type: Number, default: 0 },
    paymentDue: { type: Number, default: 0 },
    billDueDate: { type: String },
    remarks: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model("Sale", saleSchema);