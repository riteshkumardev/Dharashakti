import Supplier from "../models/Supplier.js";


/**
 * ✅ 1. Naya Supplier Register Karna
 */
export const createSupplier = async (req, res) => {
  try {
    const { name, gstin, phone, address, previousBalance } = req.body;

    // Check agar GSTIN pehle se exist karta hai
    if (gstin) {
      const existing = await Supplier.findOne({ gstin });
      if (existing) {
        return res.status(400).json({ success: false, message: "Supplier with this GSTIN already exists" });
      }
    }

    const supplier = await Supplier.create({
      name,
      gstin,
      phone,
      address,
      previousBalance: Number(previousBalance) || 0,
      totalOwed: Number(previousBalance) || 0 // Shuruat mein total = purana hisab
    });

    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error creating supplier" });
  }
};

/**
 * ✅ 2. Saare Suppliers ki List dikhana (Table ke liye)
 */
export const getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: suppliers });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching suppliers" });
  }
};

/**
 * ✅ 3. Bill katne ke baad Balance Update karna
 * Jab E-Way Bill generate hoga, tab ye function call hoga
 */
export const updateSupplierBalance = async (req, res) => {
  try {
    const { supplierId, billAmount } = req.body;

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({ success: false, message: "Supplier not found" });
    }

    // Naya balance calculate karna
    supplier.currentBillsTotal += Number(billAmount);
    supplier.totalOwed = supplier.previousBalance + supplier.currentBillsTotal;

    await supplier.save();
    res.status(200).json({ success: true, message: "Balance Updated", data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: "Update failed" });
  }
};

/**
 * ✅ 4. Supplier Delete Karna
 */
export const deleteSupplier = async (req, res) => {
  try {
    await Supplier.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Supplier Removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Delete failed" });
  }
};
/**
 * ✅ Supplier Update Controller
 */
export const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, phone, gstin, previousBalance, lastBillNo, lastBillDate } = req.body;

    const updatedData = {
      name,
      address,
      phone,
      gstin,
      previousBalance: Number(previousBalance),
      lastBillNo,
      lastBillDate, // ✨ Date update
      totalOwed: Number(previousBalance) + (req.body.currentBillsTotal || 0)
    };

    const supplier = await Supplier.findByIdAndUpdate(id, updatedData, { new: true });
    res.status(200).json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: "Update failed" });
  }
};