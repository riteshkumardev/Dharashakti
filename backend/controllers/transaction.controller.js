import Transaction from '../models/Transaction.js';
import Supplier from '../models/Supplier.js';
import Sale from '../models/Sale.js';
import Purchase from '../models/Purchase.js';
import mongoose from 'mongoose';

/* =============================================
    1️⃣ CREATE: Smart Transaction with Full Sync
   ============================================= */
export const addTransaction = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction(); // ✅ Data Integrity ke liye Transaction shuru karein

  try {
    const { partyId, amount, type, description, paymentMethod, linkTo } = req.body;
    const amt = Number(amount);

    // 1. Party/Supplier ko session ke saath dhoondein
    const party = await Supplier.findById(partyId).session(session);
    if (!party) {
      throw new Error("Party database mein nahi mili");
    }

    // 2. Balance Calculation Logic
    // IN (Payment Received) -> Udhaari kam | OUT (Payment Given) -> Udhaari badhi
    let currentBal = party.totalOwed ?? party.currentBalance ?? 0;
    let newBalance = type === 'IN' ? Number(currentBal) - amt : Number(currentBal) + amt;

    // 3. Save Transaction Entry (Ledger Passbook)
    const [transaction] = await Transaction.create([{
      partyId: party._id,
      amount: amt,
      type,
      description: description || `Manual Entry (${linkTo || 'General'})`,
      paymentMethod: paymentMethod || "Cash",
      remainingBalance: newBalance,
      date: new Date()
    }], { session });

    // 4. ✅ SMART SYNC: Sale ya Purchase table update karein (Schema Fields Fix)
    if (linkTo === 'sale' && type === 'IN') {
      // Latest pending sale dhundein jiska balance bacha ho
      const latestSale = await Sale.findOne({ 
        $or: [{ customerName: party.name }, { consigneeName: party.name }],
        $expr: { $gt: ["$totalAmount", "$amountReceived"] } // Check if amountReceived < totalAmount
      }).sort({ createdAt: -1 }).session(session);

      if (latestSale) {
        // Aapke Sale Schema ke fields update karein
        latestSale.amountReceived = (Number(latestSale.amountReceived) || 0) + amt;
        latestSale.paymentDue = Number(latestSale.totalAmount) - latestSale.amountReceived;
        await latestSale.save({ session });
      }
    } 
    else if (linkTo === 'purchase' && type === 'OUT') {
      // Latest pending purchase dhundein
      const latestPurchase = await Purchase.findOne({ 
        supplierName: party.name,
        $expr: { $gt: ["$totalAmount", "$paidAmount"] }
      }).sort({ createdAt: -1 }).session(session);

      if (latestPurchase) {
        // Purchase Schema ke fields update karein
        latestPurchase.paidAmount = (Number(latestPurchase.paidAmount) || 0) + amt;
        latestPurchase.balanceAmount = Number(latestPurchase.totalAmount) - latestPurchase.paidAmount;
        await latestPurchase.save({ session });
      }
    }

    // 5. Supplier Balance Fields ko Sync karein
    party.totalOwed = newBalance;
    party.currentBalance = newBalance; // Dono fields update karna zaroori hai
    if (party.currentBillsTotal !== undefined) party.currentBillsTotal = newBalance;
    
    await party.save({ session });

    // ✅ Commit all changes
    await session.commitTransaction();
    
    res.status(201).json({ 
      success: true, 
      message: `Transaction saved and ${linkTo || 'Ledger'} updated successfully ✅`,
      updatedBalance: newBalance 
    });

  } catch (error) {
    // ❌ Error aane par saara badlav cancel karein
    await session.abortTransaction();
    console.error("Smart Sync Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

/* =============================================
    2️⃣ READ: Get Transaction History
   ============================================= */
export const getTransactionHistory = async (req, res) => {
  try {
    const { id } = req.params; 
    // Party-wise history descending date order mein
    const history = await Transaction.find({ partyId: id }).sort({ date: -1 });
    res.status(200).json(history);
  } catch (error) {
    console.error("History Fetch Error:", error.message);
    res.status(500).json({ success: false, message: "History load nahi ho saki" });
  }
};