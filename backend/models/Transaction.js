import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  partyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  date: { type: Date, default: Date.now },
  type: { type: String, enum: ['IN', 'OUT'], required: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  description: { type: String, default: "" },
  remainingBalance: { type: Number }
}, { timestamps: true });

export default mongoose.model('Transaction', transactionSchema);