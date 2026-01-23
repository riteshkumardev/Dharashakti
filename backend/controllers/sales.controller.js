import Sale from "../models/Sale.js";
import Transaction from "../models/Transaction.js"; 
import Supplier from "../models/Supplier.js";      

/* =========================================
    🔒 Helper: Number Conversion
   ========================================= */
const toSafeNumber = (val) => {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
};

/* =========================================
    ✅ READ: Get Latest Bill Number
   ========================================= */
export const getLatestBillNo = async (req, res) => {
  try {
    const lastSale = await Sale.findOne().sort({ billNo: -1 });
    const nextBillNo = lastSale && lastSale.billNo ? Number(lastSale.billNo) + 1 : 1;
    res.json({ success: true, nextBillNo });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================================
    1️⃣ CREATE: Add Sale (Linked with Ledger)
   ========================================= */
export const addSale = async (req, res) => {
  try {
    const payload = req.body;
    const totalAmount = toSafeNumber(payload.totalPrice);
    const paidAmount = toSafeNumber(payload.paidAmount); 

    // 1. Mapping Frontend fields to Backend Schema
    const sanitizedData = {
      ...payload,
      freight: toSafeNumber(payload.travelingCost),
      buyerOrderDate: payload.orderDate || "-",
      dispatchDate: payload.deliveryNoteDate || "-",
      totalAmount: totalAmount,
    };

    const sale = await Sale.create(sanitizedData);

    // 2. ✅ AUTOMATIC LEDGER LOGIC:
    const party = await Supplier.findOne({ name: payload.consigneeName });

    if (party) {
      // Balance Fallback logic: totalOwed ya currentBalance check karein
      const initialBalance = toSafeNumber(party.totalOwed ?? party.currentBalance);
      const newBalanceAfterSale = initialBalance + totalAmount;

      // A. Transaction Entry (Debit/Udhaari badhi)
      const saleTransaction = new Transaction({
        partyId: party._id,
        type: 'OUT', 
        amount: totalAmount,
        description: `Sale: Invoice No ${payload.billNo || 'N/A'}`,
        remainingBalance: newBalanceAfterSale,
        paymentMethod: "Credit"
      });
      await saleTransaction.save();

      // B. Payment Entry (Agar payment turant mili hai)
      if (paidAmount > 0) {
        const finalBalance = newBalanceAfterSale - paidAmount;
        const paymentTransaction = new Transaction({
          partyId: party._id,
          type: 'IN', 
          amount: paidAmount,
          description: `Payment Received for Invoice ${payload.billNo || 'N/A'}`,
          remainingBalance: finalBalance,
          paymentMethod: payload.paymentMethod || "Cash"
        });
        await paymentTransaction.save();
        
        party.totalOwed = finalBalance;
        party.currentBalance = finalBalance;
      } else {
        party.totalOwed = newBalanceAfterSale;
        party.currentBalance = newBalanceAfterSale;
      }

      await party.save();
    }

    res.status(201).json({ 
      success: true, 
      message: "Sale recorded & Ledger updated successfully ✅", 
      data: sale 
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* =========================================
    2️⃣ READ: Get All Sales
   ========================================= */
export const getSales = async (req, res) => {
  try {
    const sales = await Sale.find().sort({ createdAt: -1 });
    res.json({ success: true, count: sales.length, data: sales });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================================
    3️⃣ UPDATE: Update Sale
   ========================================= */
export const updateSale = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedSale = await Sale.findByIdAndUpdate(id, req.body, { 
      new: true, 
      runValidators: true 
    });

    if (!updatedSale) {
      return res.status(404).json({ success: false, message: "Sale record nahi mila" });
    }

    res.json({ success: true, message: "Sale updated ✅", data: updatedSale });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/* =========================================
    4️⃣ DELETE: Delete Sale
   ========================================= */
export const deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findByIdAndDelete(req.params.id);
    if (!sale) {
      return res.status(404).json({ success: false, message: "Sale nahi mili" });
    }
    res.json({ success: true, message: "Sale deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* =========================================
    🧹 5️⃣ DATA CLEANUP (Fix for SyntaxError)
   ========================================= */
export const migrateSalesData = async (req, res) => {
  try {
    const sales = await Sale.find({});
    let updateCount = 0;

    for (const sale of sales) {
      if (sale.totalPrice !== undefined && (!sale.totalAmount || sale.totalAmount === 0)) {
        await Sale.findByIdAndUpdate(sale._id, { $set: { totalAmount: sale.totalPrice } });
        updateCount++;
      }
    }

    res.json({ success: true, message: `${updateCount} records fixed successfully ✅` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};