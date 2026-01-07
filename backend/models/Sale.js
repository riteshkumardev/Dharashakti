import mongoose from "mongoose";

const saleSchema = new mongoose.Schema(
  {
    // --- Bill Details ---
    // ✅ unique aur required hata diya gaya hai
    billNo: { type: Number }, 
    date: { type: String },
    
    // --- Customer Details ---
    // ✅ required hata diya gaya hai
    customerName: { type: String }, 
    customerGSTIN: { type: String },
    customerAddress: { type: String },

    // --- Buyer's Order Details ---
    buyerOrderNo: { type: String, default: "-" },
    buyerOrderDate: { type: String, default: "-" },

    // --- Dispatch Details ---
    dispatchDocNo: { type: String, default: "-" },
    dispatchDate: { type: String, default: "-" },
    dispatchedThrough: { type: String, default: "-" }, 
    destination: { type: String, default: "-" },

    // --- Driver & Vehicle Details ---
    // ✅ required hata diya gaya hai
    vehicleNo: { type: String }, 
    driverName: { type: String },
    driverPhone: { type: String },

    // --- Goods Table ---
    goods: [
      {
        product: { type: String },
        hsn: { type: String, default: "11031300" },
        quantity: { type: Number },
        rate: { type: Number },
        taxRate: { type: Number, default: 0 },
        taxableAmount: { type: Number },
      },
    ],

    // --- Calculations ---
    freight: { type: Number, default: 0 },
    taxableValue: { type: Number, default: 0 },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },

    // --- Final Amounts ---
    totalAmount: { type: Number }, 
    amountReceived: { type: Number, default: 0 },
    paymentDue: { type: Number, default: 0 },
    
    remarks: { type: String },
  },
  { timestamps: true }
);

saleSchema.pre("save", function (next) {
  this.paymentDue = (this.totalAmount || 0) - (this.amountReceived || 0);
  next();
});

export default mongoose.model("Sale", saleSchema);