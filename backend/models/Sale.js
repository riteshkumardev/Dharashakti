import mongoose from "mongoose";

const saleSchema = new mongoose.Schema(
  {
    // Bill details
    billNo: { type: Number, required: true, unique: true }, // Image ke mutabiq 168, 169...
    date: { type: String, required: true },
    
    // Customer/Supplier details
    customerName: { type: String, required: true },
    customerGSTIN: { type: String },
    customerAddress: { type: String },

    // Driver & Vehicle details
    vehicleNo: { type: String, required: true },
    driverName: { type: String },
    driverPhone: { type: String },

    // Multiple Goods (Array of items)
    goods: [
      {
        product: { type: String, required: true },
        hsn: { type: String, default: "11031300" },
        quantity: { type: Number, required: true },
        rate: { type: Number, required: true },
        taxRate: { type: Number, default: 5 },
        taxableAmount: { type: Number, required: true },
      },
    ],

    // Freight and Taxes
    freight: { type: Number, default: 0 }, // Transport Charges
    taxableValue: { type: Number, default: 0 }, // Total Taxable Amount
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },

    // Final Calculations
    totalAmount: { type: Number, required: true }, // Grand Total
    amountReceived: { type: Number, default: 0 },
    paymentDue: { type: Number, default: 0 },
    
    remarks: { type: String },
  },
  { timestamps: true }
);

// Pre-save hook to calculate payment due if not provided
saleSchema.pre("save", function (next) {
  this.paymentDue = this.totalAmount - this.amountReceived;
  next();
});

export default mongoose.model("Sale", saleSchema);