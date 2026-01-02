import Sale from "../models/Sale.js";

export const addSale = async (req, res) => {
  try {
    const sale = await Sale.create(req.body);
    res.status(201).json({ success: true, data: sale });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getSales = async (req, res) => {
  try {
    const sales = await Sale.find().sort({ createdAt: -1 });
    res.json({ success: true, count: sales.length, data: sales });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSale = async (req, res) => {
  try {
    await Sale.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Sale deleted" });
  } catch (error) {
    res.status(404).json({ success: false, message: "Sale not found" });
  }
};
